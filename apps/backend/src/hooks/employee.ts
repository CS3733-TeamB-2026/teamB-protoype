import * as q from "@softeng-app/db";
import { generateEmbedding } from "../../lib/embeddings";
import { buildEmployeeEmbeddingInput } from "../../lib/embeddingInputs";
import {req, res} from "./types"
import { createAuth0User } from "../helpers/auth0Management";
import { getEmployee } from "../helpers/getEmployee";
import { isAdmin, isUserOrAdmin } from "../helpers/permissions";

function scheduleEmployeeEmbedding(id: number, firstName: string, lastName: string, persona: string) {
    setImmediate(async () => {
        try {
            const embedding = await generateEmbedding(buildEmployeeEmbeddingInput(firstName, lastName, persona));
            await q.Employee.updateEmbedding(id, embedding);
        } catch (err) {
            console.error(`[background] Failed to embed employee id=${id}:`, err);
        }
    });
}

function buildPhotoURI(employeeId: number, filename:string): string {
    return `${employeeId}/${crypto.randomUUID()}/${filename}`;
}

const PROFILE_BUCKET = "profiles"

/** Replaces a stored storage path with a 1-hour signed URL; returns the record unchanged if no photo is set. */
async function signPhotoUrl<T extends { profilePhotoURI: string | null }>(employee: T): Promise<T> {
    if (!employee.profilePhotoURI) return employee;
    const signedUrl = await q.Bucket.createSignedUrl(
        employee.profilePhotoURI,
        3600,
        PROFILE_BUCKET
    );
    return { ...employee, profilePhotoURI: signedUrl };
}

/** Uploads or replaces the caller's profile photo (max 5 MB, images only). */
export const uploadProfilePhoto = async (req: req, res: res)=> {
    let fileURI: string | null = null;
    let uploaded = false;

    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        if (!req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({ message: "File must be an image" });
        }
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File must be under 5MB" });
        }

        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ message: "No employee found" });

        const oldURI = employee.profilePhotoURI;

        fileURI = buildPhotoURI(employee.id, req.file.originalname);
        const uploadResult = await q.Bucket.uploadFile(req.file.buffer, fileURI, PROFILE_BUCKET);
        uploaded = true;
        fileURI = uploadResult.path;

        const updated = await q.Employee.updateProfilePhotoURI(employee.id, fileURI);

        if (oldURI) {
            await q.Bucket.deleteFile(oldURI, PROFILE_BUCKET).catch(console.error);
        }

        return res.status(200).json(updated);

    } catch (error) {
        if (uploaded && fileURI) {
            await q.Bucket.deleteFile(fileURI, PROFILE_BUCKET).catch(console.error);
        }
        console.error(error);
        return res.status(500).end();
    }
}

/**
 * Returns the authenticated employee's profile with a signed photo URL.
 * Uses raw auth0Id (not getEmployee helper) because this is the bootstrap
 * endpoint — the frontend calls it on login before the employee record is
 * guaranteed to exist, and a 404 here is a valid signal, not an error.
 */
export const getMe = async (req: req, res: res) => {
    const auth0Id = req.auth?.payload.sub;

    try {
        if (!auth0Id) return res.status(401).end();

        const employee = await q.Employee.queryEmployeeByAuth(auth0Id);

        if (!employee) return res.status(404).json({error: "No employee found"});

        let signedPhotoUrl: string | null = null;
        if (employee.profilePhotoURI) {
            signedPhotoUrl = await q.Bucket.createSignedUrl(
                employee.profilePhotoURI,
                3600,
                PROFILE_BUCKET
            )
        }

        return res.status(200).json({
            ...employee,
            profilePhotoURI: signedPhotoUrl,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }


}

export const getAllEmployees = async (req: req, res: res) => {
    try {
        const employees = await q.Employee.queryAllEmployees();

        const withSignedUrls = await Promise.all(employees.map(signPhotoUrl));

        return res.status(200).json(withSignedUrls);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getEmployeeById = async (req: req, res: res) => {
    try {
        const id = parseInt(req.params.id);
        const employee = await q.Employee.queryEmployeeById(id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        return res.status(200).json(await signPhotoUrl(employee));
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const createEmployee = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const caller = await getEmployee(req);
        if (!caller) return res.status(404).json({ error: "Employee not found" });
        if (!isAdmin(caller)) return res.status(403).json({ error: "Admin only" });

        const result = await q.Employee.createEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            payload.persona
        );
        scheduleEmployeeEmbedding(result.id, result.firstName, result.lastName, result.persona);
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const createEmployeeWithAuth0 = async (req: req, res: res) => {
    const { id, firstName, lastName, persona, username, password, email } = req.body;

    try {
        const caller = await getEmployee(req);
        if (!caller) return res.status(404).json({ error: "Employee not found" });
        if (!isAdmin(caller)) return res.status(403).json({ error: "Admin only" });

        const auth0Id = await createAuth0User(username, password, email);

        if (!auth0Id) {
            return res.status(500).json({ error: "Failed to create Auth0 user" });
        }

        const employee = await q.Employee.createEmployeeWithAuth0(
            id,
            firstName,
            lastName,
            persona,
            auth0Id
        );
        scheduleEmployeeEmbedding(employee.id, employee.firstName, employee.lastName, employee.persona);
        return res.status(201).json(employee);

    } catch (error){
        console.error(error)
        res.status(500).json({ error: "Failed to create employee" })
    }
}

export const updateEmployee = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const caller = await getEmployee(req);
        if (!caller) return res.status(404).json({ error: "Employee not found" });
        if (!isUserOrAdmin(parseInt(payload.id), caller))
            return res.status(403).json({ error: "Access denied" });

        // Non-admins cannot change persona — use the existing value to prevent self-escalation
        const persona = isAdmin(caller) ? payload.persona : caller.persona;

        const result = await q.Employee.updateEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            persona,
        );
        scheduleEmployeeEmbedding(result.id, result.firstName, result.lastName, result.persona);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const deleteEmployee = async (req: req, res: res) => {
    const payload = req.body;
    try {
        const caller = await getEmployee(req);
        if (!caller) return res.status(404).json({ error: "Employee not found" });
        if (!isAdmin(caller)) return res.status(403).json({ error: "Admin only" });

        await q.Employee.deleteEmployee(payload.id);
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const getDashboardLayout = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const result = await q.Employee.getDashboardLayout(employee.id);
        return res.status(200).json({ layout: result?.widgetLayout ?? null });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};

export const updateDashboardLayout = async (req: req, res: res) => {
    try {
        const employee = await getEmployee(req);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const { layout } = req.body;
        if (!Array.isArray(layout)) {
            return res.status(400).json({ error: "Invalid layout: expected array" });
        }

        await q.Employee.updateDashboardLayout(employee.id, layout);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
};
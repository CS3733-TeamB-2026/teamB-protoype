import 'dotenv/config'
import express from 'express'
import morgan from 'morgan';
import cors from 'cors'
import multer from "multer";
import bcrypt from 'bcrypt';
import mime from 'mime-types';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

import * as q from "@softeng-app/db";

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Employee
app.get("/api/employee", async (req, res) => {
    try {
        const employees = await q.Employee.queryAllEmployees();
        return res.status(200).json(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.get("/api/employee/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const employees = await q.Employee.queryEmployeeById(id);
        return res.status(200).json(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post("/api/employee", async (req, res) => {
    const payload = req.body;
    try {
        const result = await q.Employee.createEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            payload.persona
        );
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.put("/api/employee", async (req, res) => {
    const payload = req.body;
    try {
        const result = await q.Employee.updateEmployee(
            payload.id,
            payload.firstName,
            payload.lastName,
            payload.persona,
        );
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.delete("/api/employee", async (req, res) => {
    const payload = req.body;
    try {
        const result = await q.Employee.deleteEmployee(payload.id);
        return res.status(204).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

// Content
app.get("/api/content", async (req, res) => {
    try {
        const content = await q.Content.queryAllContent();
        return res.status(200).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.get("/api/content/:persona", async (req, res) => {
    const persona = req.params.persona;
    try {
        const content = await q.Content.queryContentByPersona(persona);
        return res.status(200).json(content);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post("/api/content", upload.single("file"), async (req, res) => {
    const payload = req.body;
    let fileURI: string | null = null;
    let uploaded = false;
    try {
        if (req.file) {
            fileURI =
                (payload.ownerID as String) +
                "/" +
                crypto.randomUUID() +
                "/" +
                req.file.originalname;
            const uploadResult = await q.Bucket.uploadFile(req.file.buffer, fileURI);
            uploaded = true;
            fileURI = uploadResult.path;
        }
        const result = await q.Content.createContent(
            payload.name,
            payload.linkURL || null,
            fileURI,
            payload.ownerID ? parseInt(payload.ownerID) : null,
            payload.contentType,
            payload.status,
            new Date(payload.lastModified),
            payload.expiration ? new Date(payload.expiration) : null,
            payload.jobPosition,
        );
        return res.status(201).json(result);
    } catch (error) {
        if (uploaded && fileURI) {
            await q.Bucket.deleteFile(fileURI).catch(console.error);
        }
        console.error(error);
        return res.status(500).end();
    }
});

app.put("/api/content", async (req, res) => {
    const payload = req.body;
    try {
        const result = await q.Content.updateContent(
            payload.id,
            payload.name,
            payload.linkURL,
            payload.fileURI,
            payload.ownerID,
            payload.contentType,
            payload.status,
            payload.lastModified,
            payload.expiration,
            payload.targetPersona,
        );
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.get("/api/content/info/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await q.Content.queryContentById(id);
        if (!content || !content.fileURI) {
            return res.status(404).json({ message: "File not found" });
        }
        const metadata = await q.Bucket.getFileMetadata(content.fileURI);
        return res.status(200).json(metadata);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.get("/api/content/download/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await q.Content.queryContentById(id);
        if (!content || !content.fileURI) {
            return res.status(404).json({ message: "File not found" });
        }
        const blob = await q.Bucket.downloadFile(content.fileURI);
        const buffer = Buffer.from(await blob.arrayBuffer());
        const filename = content.fileURI.split("/").pop() ?? "download";
        const contentType = mime.lookup(filename) || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        res.setHeader("Content-Length", buffer.length);
        return res.send(buffer);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.get("/api/content/preview", async (req, res) => {
    try {
        const url = req.query.url as string;
        if (!url) return res.status(400).json({ message: "Missing url parameter" });
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        const base = new URL(url);
        const og = (prop: string) => $(`meta[property="og:${prop}"]`).attr("content") ?? null;
        const meta = (name: string) => $(`meta[name="${name}"]`).attr("content") ?? null;
        const resolve = (href: string | null) => {
            if (!href) return null;
            try { return new URL(href, base.origin).href; } catch { return null; }
        };
        const rawFavicon = $('link[rel="icon"]').attr("href")
            ?? $('link[rel="shortcut icon"]').attr("href")
            ?? null;
        return res.status(200).json({
            title: og("title") ?? $("title").text() ?? null,
            description: og("description") ?? meta("description") ?? null,
            image: resolve(og("image")),
            siteName: og("site_name") ?? null,
            favicon: resolve(rawFavicon) ?? `${base.origin}/favicon.ico`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.delete("/api/content", async (req, res) => {
    const payload = req.body;
    try {
        const result = await q.Content.deleteContent(payload.id);
        return res.status(204).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

// Service Requests
app.get("/api/servicereqs", async (req, res) => {
    try {
        const servicereqs = await q.ServiceReqs.queryAllServiceReqs();
        return res.status(200).json(servicereqs);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.get("/api/assigned", async (req, res) => {
    try {
        const id = parseInt(req.query.id as string);
        const assigned = await q.ServiceReqs.queryAssignedServiceReqs();
        return res.status(200).json(assigned);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

// Login
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const login = await q.Login.queryLoginByUsername(username);

        if (!login) {
            return res.status(401).json({ message: "User not found" });
        }

        const match = await bcrypt.compare(password, login.passwordHash);
        if (!match) {
            return res.status(401).json({ message: "Incorrect Password" });
        }

        const employee = await q.Employee.queryEmployeeById(login.employeeID);
        return res.status(200).json(employee);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

app.post("/api/login/create", async (req, res) => {
    try {
        const {userName, password, employeeID} = req.body;
        await q.Login.createLogin(userName, password, employeeID);
        return res.status(201).json({message:"Account Created"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Account Creation Failed"});
    }
})

app.delete('/api/login', async (req, res) => {
    const payload = req.body
    try {
        const result = await q.Login.deleteLogin(
            payload.id
        )
        return res.status(204).json(result) // 204 since no object remains
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

app.get("/api/employee/all", async (req, res) => {
    try {
        const employees = await q.Employee.queryAllEmployeesWithLogin();
        return res.status(200).json(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
})

app.put('/api/login', async (req, res) => {
    const payload = req.body
    try {
        const result = await q.Login.updateLogin(
            payload.userName,
            payload.employeeID
        );
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

/*
app.post("/form", (req, res) => {
    addToDB(res)
})
*/
    /*
    app.post("/form", (req, res) => {
        addToDB(res)
    })
    */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(3000, '0.0.0.0', () => {
        console.log(`Server is listening on port 3000`);
        console.log(`    http://localhost:3000`);
    })

import * as q from "@softeng-app/db";
import type { EmployeeModel } from "@softeng-app/db";
import { req } from "../hooks/types";

/** Resolves the calling employee from the Auth0 JWT. Returns null if not found. */
export async function getEmployee(req: req): Promise<EmployeeModel | null> {
    const auth0Id = req.auth?.payload.sub;
    const employee = await q.Employee.queryEmployeeByAuth(auth0Id);
    return employee ?? null;
}

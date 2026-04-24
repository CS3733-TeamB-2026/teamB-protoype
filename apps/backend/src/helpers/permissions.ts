import type { Persona } from "@softeng-app/db";

/** Returns true if the employee holds the admin persona. */
export function isAdmin(persona: Persona | string): boolean {
    return persona === "admin";
}

/** Returns true if the employee is the owner of the resource or is an admin. */
export function isOwnerOrAdmin(ownerId: number, employeeId: number, persona: Persona | string): boolean {
    return ownerId === employeeId || isAdmin(persona);
}

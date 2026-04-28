// Structural types rather than EmployeeModel so these helpers work with
// any object that has the right fields — including the employeeSelect subset and test fixtures.

/** Returns true if the employee holds the admin persona. */
export function isAdmin(employee: { persona: string }): boolean {
    return employee.persona === "admin";
}

/** Returns true if the employee is the owner of the resource or is an admin. */
export function isUserOrAdmin(ownerId: number, employee: { id: number; persona: string }): boolean {
    return ownerId === employee.id || isAdmin(employee);
}

/** Returns true if the employee holds the given persona or is an admin. */
export function isPersonaOrAdmin(persona: string, employee: { persona: string }): boolean {
    return employee.persona === persona || isAdmin(employee);
}

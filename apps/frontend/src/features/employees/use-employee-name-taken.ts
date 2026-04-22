import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type { Employee } from "@/lib/types.ts";

/** Fetches all employees on open and returns a function that checks whether
 *  a first+last name combination is already in use. Pass `excludeId` when
 *  editing an existing employee so their own name doesn't count as taken. */
export function useEmployeeNameTaken(open: boolean, excludeId?: number) {
    const [takenNames, setTakenNames] = useState<Set<string>>(new Set());
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/employee", { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) return;
                const employees: Employee[] = await res.json();
                const names = new Set(
                    employees
                        .filter((e) => e.id !== excludeId)
                        .map((e) => `${e.firstName.trim().toLowerCase()}|${e.lastName.trim().toLowerCase()}`)
                );
                setTakenNames(names);
            } catch {
                // non-fatal — uniqueness check skipped if fetch fails
            }
        })();
    }, [open, excludeId, getAccessTokenSilently]);

    function checkNameTaken(first: string, last: string): string {
        if (!first.trim() || !last.trim()) return "";
        const key = `${first.trim().toLowerCase()}|${last.trim().toLowerCase()}`;
        return takenNames.has(key) ? "An employee with this name already exists." : "";
    }

    return checkNameTaken;
}
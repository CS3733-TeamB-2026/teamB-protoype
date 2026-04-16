import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Converts a camelCase enum value to a human-readable label.
 * e.g. `"inProgress"` → `"In Progress"`, `"businessAnalyst"` → `"Business Analyst"`. */
export function formatLabel(value: string): string {
    return value
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase());
}

/** Formats a person's name as "Last, First", or `""` if the person is null. */
export function formatName(person: { firstName: string; lastName: string } | null | undefined): string {
    return person ? `${person.lastName}, ${person.firstName}` : "";
}

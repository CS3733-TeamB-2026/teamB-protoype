import { useState } from "react";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    persona: "underwriter" | "businessAnalyst" | "admin";
}

export function useUser(): [User | null, (user: User | null) => void] {
    return useState<User | null>(() =>
        JSON.parse(localStorage.getItem("user") || "null")
    );
}

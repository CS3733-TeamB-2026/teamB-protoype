import { createContext, useContext, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type { Persona } from "@/lib/types.ts";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    persona: Persona;
    profilePhotoURI: string;
}

const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, getAccessTokenSilently, user: auth0User } = useAuth0();
    const [employee, setEmployee] = useState<User | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchEmployee = async () => {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/employee/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setEmployee({
                ...data,
                userName: auth0User?.preferred_username || auth0User?.nickname || auth0User?.name || "",
            });
        };
        fetchEmployee();
    }, [isAuthenticated, getAccessTokenSilently, auth0User]);

    return <UserContext.Provider value={employee}>{children}</UserContext.Provider>;
}

export function useUser() {
    return useContext(UserContext);
}
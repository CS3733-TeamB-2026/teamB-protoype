import {useEffect, useState} from "react";
import { useAuth0 } from "@auth0/auth0-react";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    persona: "underwriter" | "businessAnalyst" | "admin";
}

export const useUser = () => {
    const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();
    const [employee, setEmployee] = useState<User | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchEmployee = async () => {
            const token = await getAccessTokenSilently();
            const res = await fetch('/api/employee/me', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log("employee data: ", data);
            setEmployee({
                ...data,
                userName: user?.preferred_username || user?.nickname || user?.name || ''
            });
        };
        fetchEmployee();
    }, [isAuthenticated, getAccessTokenSilently, user]);

    return employee;
}

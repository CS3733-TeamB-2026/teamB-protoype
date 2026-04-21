import {createContext, useCallback, useContext, useEffect, useState} from "react";
import { useAuth0 } from "@auth0/auth0-react";

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    persona: "underwriter" | "businessAnalyst" | "admin";
    profilePhotoURI: string;
}

type UserContextValue = {
    user: User | null;
    loading: boolean;
    updateUser: (updates: Partial<User>) => Promise<void>;
    refetch: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, getAccessTokenSilently, user: auth0User } = useAuth0();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        if (!isAuthenticated) {
            setUser(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/employee/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setUser({
                ...data,
                userName: auth0User?.preferred_username || auth0User?.nickname || auth0User?.name || "",
            });
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, getAccessTokenSilently, auth0User])

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const updateUser = useCallback(
        async (updates: Partial<User>) => {
            if (!user) throw new Error("No user to update");

            // Merge updates onto current user to build the full object
            const fullEmployee = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                persona: user.persona,
                ...updates,
            };

            const token = await getAccessTokenSilently();
            const res = await fetch(`/api/employee`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(fullEmployee),
            });
            if (!res.ok) throw new Error("Failed to update user");
            setUser((prev) => (prev ? { ...prev, ...updates } : prev));
        },
        [user, getAccessTokenSilently]
    );

    return (
        <UserContext.Provider value={{ user, loading, updateUser, refetch: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used inside UserProvider");
    return ctx;
}


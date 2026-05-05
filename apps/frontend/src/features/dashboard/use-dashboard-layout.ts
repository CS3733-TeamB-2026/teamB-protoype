import { useEffect, useState } from "react";
import { DEFAULT_LAYOUT, type WidgetLayoutEntry } from "@/features/dashboard/widget-registry";
import { useAuth0 } from "@auth0/auth0-react";

/**
 * Loads and persists the current employee's dashboard widget layout.
 *
 * On mount: fetches `GET /api/employee/dashboard-layout`; falls back to
 * `DEFAULT_LAYOUT` if the employee has no saved layout or the request fails.
 *
 * `setLayout` mirrors the `useState` setter API but fire-and-forgets a
 * `PUT /api/employee/dashboard-layout` on every call so changes are persisted
 * without requiring an explicit save action.
 */
export function useDashboardLayout() {

    const [layout, setLayoutState] = useState<WidgetLayoutEntry[]>(DEFAULT_LAYOUT);
    const [isLoading, setIsLoading] = useState(true);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        let cancelled = false;
        (
            async () => {
                try {
                    const token = await getAccessTokenSilently();
                    const res = await fetch("/api/employee/dashboard-layout", {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
                    const data = await res.json();
                    if (!cancelled) {
                        setLayoutState(data.layout ?? DEFAULT_LAYOUT);
                    }
                } catch (error) {
                    console.error(error);
                    if (!cancelled) setLayoutState(DEFAULT_LAYOUT);
                } finally {
                    if (!cancelled) setIsLoading(false);
                }
            }
        )();
        return () => { cancelled = true; };
    }, [getAccessTokenSilently]);

    const setLayout: React.Dispatch<React.SetStateAction<WidgetLayoutEntry[]>> = (action) => {
        setLayoutState((prev) => {
            const next = typeof action === "function"
                ? (action as (p: WidgetLayoutEntry[]) => WidgetLayoutEntry[])(prev)
                : action;

            (async () => {
                try {
                    const token = await getAccessTokenSilently();
                    await fetch("/api/employee/dashboard-layout", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ layout: next }),
                    });
                } catch (e) {
                    console.error("Failed to save dashboard layout:", e);
                }
            })();

            return next;
        });
    };

    return { layout, setLayout, isLoading };

}
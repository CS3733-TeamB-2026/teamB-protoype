import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Loader2, ChevronsUpDown } from "lucide-react";
import { EmployeeCard, type EmployeeCardData } from "@/components/shared/EmployeeCard.tsx";
import { useAuth0 } from "@auth0/auth0-react"

interface Props {
    selectedId: number;
    onSelect: (id: number) => void;
}

export function EmployeePicker({ selectedId, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const [employees, setEmployees] = useState<EmployeeCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const load = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/employee/all", { headers: { Authorization: `Bearer ${token}` } });
                const data: EmployeeCardData[] = await res.json();
                setEmployees(data);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [getAccessTokenSilently]);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const selected = employees.find((e) => Number(e.id) === Number(selectedId));

    const filtered = employees.filter((e) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
            e.firstName.toLowerCase().includes(q) ||
            e.lastName.toLowerCase().includes(q) ||
            e.persona.toLowerCase().includes(q)
        );
    });

    return (
        <div ref={containerRef} className="relative">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between h-auto py-2 px-3 font-normal"
                onClick={() => setOpen((v) => !v)}
            >
                {loading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                    </span>
                ) : selected ? (
                    <EmployeeCard employee={selected} compact />
                ) : (
                    <span className="text-muted-foreground">Select employee...</span>
                )}
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </Button>

            {open && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                            autoFocus
                        />
                    </div>

                    <div className="overflow-y-auto max-h-64 overscroll-contain">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading employees...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No employees found.
                            </p>
                        ) : (
                            filtered.map((emp) => (
                                <Button
                                    key={emp.id}
                                    type="button"
                                    variant="ghost"
                                    className={`w-full justify-start h-auto px-3 py-2 font-normal rounded-none ${
                                        Number(emp.id) === Number(selectedId) ? "bg-accent" : ""
                                    }`}
                                    onClick={() => {
                                        onSelect(emp.id);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <EmployeeCard employee={emp} compact />
                                </Button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

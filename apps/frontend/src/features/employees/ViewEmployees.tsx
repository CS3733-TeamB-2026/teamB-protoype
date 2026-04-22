import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useEffect, useState } from "react";
import {Loader2, Pencil, Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { EditEmployeeDialog } from "@/features/employees/EditEmployeeDialog.tsx";
import { AddEmployeeDialog } from "@/features/employees/AddEmployeeDialog.tsx";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog.tsx";
import { Users } from "lucide-react";
import { SortableHead } from "@/components/shared/SortableHead.tsx";
import { useSortState, applySortState } from "@/hooks/use-sort-state.ts";
import {PersonaBadge} from "@/components/shared/PersonaBadge.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { findMatches, /*highlight,*/ highlightRange } from "@/lib/highlight.tsx";
import { useAuth0 } from "@auth0/auth0-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import type { Employee } from "@/lib/types.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";

function ViewEmployees() {

    usePageTitle("Manage Employees");

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [addOpen, setAddOpen] = useState(false);  // <-- new
    const {user} = useUser();
    const [sort, toggleSort] = useSortState<"id" | "firstName" | "lastName" | "persona">({column: "id", direction: "asc"});
    const [searchTerm, setSearchTerm] = useState("");
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {

        const fetchEmployees = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/employee/all", {
                    headers: {Authorization: `Bearer ${token}`},
                })
                const data = await res.json();
                setEmployees(data);
                setLoading(false);
            } catch {
                setLoading(false);
            }
        }

        fetchEmployees();

    }, [getAccessTokenSilently]);

    const filteredEmployees = employees.filter((e) => {
        const query = searchTerm.toLowerCase().trim().replace(/\s/g, "");
        const concatName = e.firstName + e.lastName;
        if (!query) return true;

        return (
            e.firstName.toLowerCase().includes(query) ||
            e.lastName.toLowerCase().includes(query) ||
            concatName.toLowerCase().includes(query) ||
            e.persona.toLowerCase().includes(query) ||
            e.id.toString().includes(query)
        );
    });

    const handleDelete = async (employee: Employee) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`/api/employee`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: employee.id }),
        });
        if (res.ok) {
            setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
        }
        setDeleteTarget(null);
    };

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <>
            <Hero
                icon={Users}
                title="View Employees"
                description="View, update, and delete employees."
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center px-4">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">All Employees</CardTitle>
                    <CardDescription>Total Employees: {employees.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative">
                            <Search
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
                            />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 h-10 text-lg! pl-2! pr-8 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                        </div>
                        <div>
                            {/* Opens AddServiceReqDialog instead of navigating away */}
                            <Button
                                onClick={() => setAddOpen(true)}
                                className="cursor-pointer p-0! gap-0! border-0! group flex duration-300 items-center overflow-hidden ease-in-out rounded-full hover:w-48 hover:bg-accent-dark hover:text-primary-foreground active:brightness-80 transition-all bg-accent text-primary-foreground w-12 h-12 text-lg justify-start"
                            >
                                <span className="flex items-center justify-center min-w-12 h-12">
                                    <Plus className="w-8! h-8! text-primary-foreground" />
                                </span>
                                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Add Employees</span>
                            </Button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm">Loading...</p>
                        </div>
                    ) : (
                        <Table className="text-left">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="uppercase tracking-wider text-muted-foreground select-none">Avatar</TableHead>
                                    <SortableHead column="id" label="ID" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="firstName" label="First Name" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="lastName" label="Last Name" sort={sort} onSort={toggleSort} className="w-full" />
                                    <SortableHead column="persona" label="Persona" sort={sort} onSort={toggleSort} />
                                    <TableHead className="uppercase tracking-wider text-muted-foreground select-none">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applySortState(filteredEmployees, sort, (e, col) => {
                                    if (col === "id") return e.id;
                                    if (col === "firstName") return e.firstName;
                                    if (col === "lastName") return e.lastName;
                                    if (col === "persona") return e.persona;
                                }).map((employee, index) => {
                                    const matches = findMatches(employee.firstName+employee.lastName, searchTerm);
                                    return (
                                        <TableRow key={employee.id} className={`${ index % 2 === 0 ? "bg-muted/10" : ""}`}>
                                            <TableCell>
                                                <Avatar className="cursor-pointer w-10 h-10 ">
                                                    {
                                                        employee.profilePhotoURI?
                                                            <AvatarImage src={employee.profilePhotoURI} />
                                                            :
                                                            <AvatarFallback className="bg-accent text-primary-foreground">{" " + employee?.firstName[0] + employee?.lastName[0]}</AvatarFallback>
                                                    }
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">{employee.id}</TableCell>
                                            <TableCell className="font-medium">{highlightRange(employee.firstName, 0, matches)}</TableCell>
                                            <TableCell className="font-medium">{highlightRange(employee.lastName, employee.firstName.length, matches)}</TableCell>
                                            <TableCell  className="text-center">
                                                <PersonaBadge
                                                    persona={employee.persona}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={employee.id === user?.id}
                                                        onClick={() => {
                                                            setEditingEmployee(employee);
                                                            setEditOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={employee.id === user?.id}
                                                        onClick={() => setDeleteTarget(employee)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                description={deleteTarget ? <span>This will permanently delete {deleteTarget.persona} <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> and any files they own.</span> : undefined}
                onConfirm={() => handleDelete(deleteTarget!)}
            />

            {editingEmployee && (
                <EditEmployeeDialog
                    key={editingEmployee.id}
                    content={editingEmployee}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSave={(updated) =>
                        setEmployees((prev) =>
                            prev.map((e) => (e.id === updated.id ? updated : e))
                        )
                    }
                />
            )}

            {/* Add employee dialog — appends new employee to the table on success */}
            <AddEmployeeDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSave={(created) => setEmployees((prev) => [...prev, created])}
            />
        </>
    );
}

export default ViewEmployees;
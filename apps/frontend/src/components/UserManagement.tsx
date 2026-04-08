import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Hero } from "@/components/shared/Hero.tsx";
import { EditEmployeeDialog } from "@/components/EditEmployeeDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

export type Employee = {
    firstName: string;
    lastName: string;
    id: number;
    persona: string;
    login?: {
        userName: string;
    };
};

function UserManagement() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        fetch("/api/employee/all")
            .then((res) => res.json())
            .then((data) => {
                setEmployees(data.sort((a: Employee, b: Employee) => a.id - b.id));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleDelete = async (employee: Employee) => {
        const res = await fetch(`/api/employee`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: employee.id }),
        });
        if (res.ok) {
            setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
        }
        setDeleteTarget(null);
    };

    return (
        <>
            <Hero
                icon="employees"
                title="User Management"
                description="Add, update, and delete users."
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">All Users</CardTitle>
                    <CardDescription>Total Users: {employees.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link to="/employeeform">
                        <Button className="my-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-60 mx-auto rounded-lg px-2 py-6 text-xl">
                            Add Employee
                        </Button>
                    </Link>

                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm">Loading...</p>
                        </div>
                    ) : (
                        <Table className="text-left">
                            <TableHeader>
                                <TableRow className="uppercase tracking-wider text-muted-foreground select-none hover:bg-transparent">
                                    <TableHead>ID</TableHead>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Persona</TableHead>
                                    <TableHead>User Name</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>{employee.id}</TableCell>
                                        <TableCell>{employee.firstName}</TableCell>
                                        <TableCell>{employee.lastName}</TableCell>
                                        <TableCell className="capitalize">{employee.persona}</TableCell>
                                        <TableCell>{employee.login?.userName || "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={employee.id === currentUser?.id}
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
                                                    disabled={employee.id === currentUser?.id}
                                                    onClick={() => setDeleteTarget(employee)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                description={deleteTarget ? `This will permanently delete ${deleteTarget.firstName} ${deleteTarget.lastName}.` : undefined}
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
            />

            {editingEmployee && (
                <EditEmployeeDialog
                    key={editingEmployee.id}
                    employee={editingEmployee}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSave={(updated) =>
                        setEmployees((prev) =>
                            prev.map((e) => (e.id === updated.id ? updated : e))
                        )
                    }
                />
            )}
        </>
    );
}

export default UserManagement;

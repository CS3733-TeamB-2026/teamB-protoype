import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {useEffect, useState} from "react";
import { Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent, DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import banner from "../assets/hanover_banner.webp"
import { Link } from "react-router-dom";

function UserManagement() {

    type Employee = {
        firstName: string;
        lastName: string;
        id: number;
        persona: string;
        login?: {
            userName: string;
        }
    }

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [editOpen, setEditOpen] = useState<boolean>(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [error, setError] = useState<string>("");
    const [modifiedEmployee, setModifiedEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        fetch("/api/employee/all")
            .then(res => res.json())
            .then(data => {
                setEmployees(data.sort((a: Employee, b: Employee) => a.id - b.id))
            })
    }, [])

    const handleModify = async () => {

        if (!modifiedEmployee) return;

        if (!modifiedEmployee.firstName.trim() || !modifiedEmployee.lastName.trim() || !modifiedEmployee.persona.trim()) {
            setError("Fields may not be empty.");
            return
        }

        setError("")

        const empRes = await fetch("api/employee", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: modifiedEmployee.id,
                firstName: modifiedEmployee.firstName,
                lastName: modifiedEmployee.lastName,
                persona: modifiedEmployee.persona
            })
        })

        if (modifiedEmployee.login?.userName) {
            await fetch("api/login", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userName: modifiedEmployee.login.userName,
                    employeeID: modifiedEmployee.id
                })
            })
        }

        if (empRes.ok) {
            setEmployees(employees.map(e => e.id === modifiedEmployee.id ? modifiedEmployee : e));
            setEditOpen(false);
        }

    }

    const handleDelete = async (employee: Employee) => {

        const empRes = await fetch(`/api/employee`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({id: employee.id})
        })

        if (empRes.ok) {
            setEmployees(employees.filter(e => e.id !== employee.id))
        }
    }

    return (
      <>
          <div className="relative flex flex-col items-center justify-center py-20 px-8 text-primary-foreground shadow-xl overflow-hidden">
              <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                      backgroundImage: `url(${banner})`,
                      backgroundPosition: "center 38%"
                  }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-white/50 via-transparent to-white/50" />
              <div className="relative z-10 text-center flex flex-col items-center rounded-lg py-6 px-8"
                   style={{
                       background: "radial-gradient(ellipse, rgba(0,0,0,.9) 0%, transparent 70%)",
                       backgroundSize: "105% 105%",
                       backgroundPosition: "center"
                   }}>
                  <h1 className="text-5xl font-bold text-primary-foreground " style={{ textShadow: "0 0 30px rgba(0,0,0,.9), 0 0 50px rgba(0,0,0,.6)" }} >User Management</h1>
                  <p className="text-lg mb-8 mt-4 text-primary-foreground" style={{ textShadow: "0 0 30px rgba(0,0,0,1), 0 0 50px rgba(0,0,0,1)" }} >Add, Remove, and Modify users here.</p>
                  <Users className="w-8 h-8 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]" />
              </div>
          </div>

          <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
              <CardHeader>
                  <CardTitle className="text-3xl text-primary mt-4">All Users</CardTitle>
                  <CardDescription>Total Users: {employees.length}</CardDescription>
              </CardHeader>
              <CardContent>

                  <Link to="/employeeform">
                      <Button className="my-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-60 mx-auto rounded-lg px-2 py-6 text-xl">Add Employee</Button>
                  </Link>

                  <div className="max-w-4xl mx-auto">
                      <Table className="my-4">
                          <TableHeader>
                              <TableRow className="text-lg bg-muted/80">
                                  <TableHead className="text-center font-light">ID</TableHead>
                                  <TableHead className="text-center font-light">First Name</TableHead>
                                  <TableHead className="text-center font-light">Last Name</TableHead>
                                  <TableHead className="text-center font-light">Persona</TableHead>
                                  <TableHead className="text-center font-light">User Name</TableHead>
                                  <TableHead className="text-center font-light">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {employees.map((employee: Employee) => (
                                  <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                                      <TableCell>{employee.id}</TableCell>
                                      <TableCell>{employee.firstName}</TableCell>
                                      <TableCell>{employee.lastName}</TableCell>
                                      <TableCell className="capitalize">{employee.persona}</TableCell>
                                      <TableCell>{employee.login?.userName || "NA"}</TableCell>
                                      <TableCell>
                                          <div className="flex justify-center gap-2">
                                              <Button variant="outline" size="sm" onClick={ () => {
                                                  setEditOpen(true);
                                                  setEditingEmployee(employee);
                                                  setModifiedEmployee({...employee});
                                              }}>
                                                  <Pencil className="w-4 h-4" />
                                              </Button>
                                              <Button variant="destructive" size="sm" onClick={() => handleDelete(employee)}>
                                                  <Trash2 className="w-4 h-4" />
                                              </Button>
                                          </div>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>

              </CardContent>
          </Card>

          { editingEmployee && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Modify User</DialogTitle>
                          <DialogDescription className="text-md text-muted-foreground">Modify user values here.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-2">
                          {error && <p className="text-sm text-destructive">{error}</p>}
                          <div>
                              <Label className="my-2">Employee ID</Label>
                              <Input defaultValue={editingEmployee?.id} className="bg-secondary" placeholder="Enter Employee ID" disabled />
                          </div>
                          <div>
                              <Label className="my-2">First Name</Label>
                              <Input defaultValue={editingEmployee?.firstName} className="bg-secondary" placeholder="Enter Employee First Name" onChange={(e) => {
                                  setModifiedEmployee(prev => prev ? {...prev, firstName: e.target.value} : null);
                              }} />
                          </div>
                          <div>
                              <Label className="my-2">Last Name</Label>
                              <Input defaultValue={editingEmployee?.lastName} className="bg-secondary" placeholder="Enter Employee Last Name" onChange={(e) => {
                                  setModifiedEmployee(prev => prev ? {...prev, lastName: e.target.value} : null);
                              }} />
                          </div>
                          <div>
                              <Label className="my-2">Persona</Label>
                              <Select defaultValue={modifiedEmployee?.persona} onValueChange={(value) => {
                                  setModifiedEmployee(prev => prev ? {...prev, persona: value} : null);
                              }} >
                                  <SelectTrigger className="bg-secondary">
                                      <SelectValue placeholder="Select Persona" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="underwriter">Underwriter</SelectItem>
                                      <SelectItem value="businessAnalyst">Business Analyst</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div>
                              <Label className="my-2">Username</Label>
                              <Input defaultValue={editingEmployee?.login?.userName} className="bg-secondary" placeholder="Enter Employee Username" onChange={(e) => {
                                  setModifiedEmployee(prev => prev ? {...prev, login: {...prev.login, userName: e.target.value}} : null);
                              }} />
                          </div>
                          <button className="mt-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-20 mx-auto rounded-lg px-2 py-1" onClick={ () => handleModify()}>Apply</button>
                      </div>
                  </DialogContent>

              </Dialog>
          )}

      </>
    );
}

export default UserManagement;
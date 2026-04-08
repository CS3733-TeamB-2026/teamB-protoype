import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {useEffect, useState} from "react";
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"


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

    useEffect(() => {
        fetch("/api/employee/all")
            .then(res => res.json())
            .then(data => {
                setEmployees(data)
                console.log(data)
            })
    }, [])

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
          <div className="flex flex-col items-center justify-center py-20 px-8 bg-secondary-foreground text-primary-foreground">
              <h1 className="text-4xl font-bold mb-4">User Management</h1>
              <p className="text-lg mb-4 text-primary-foreground/80">Add, Remove, and Modify users here.</p>
          </div>

          <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
              <CardHeader>
                  <CardTitle className="text-xl">All Users</CardTitle>
                  <CardDescription>Total Users: {employees.length}</CardDescription>
              </CardHeader>
              <CardContent>

                  <div className="max-w-3xl mx-auto">
                      <Table className="my-4">
                          <TableHeader>
                              <TableRow className="text-lg">
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
                                  <TableRow key={employee.id}>
                                      <TableCell>{employee.id}</TableCell>
                                      <TableCell>{employee.firstName}</TableCell>
                                      <TableCell>{employee.lastName}</TableCell>
                                      <TableCell>{employee.persona}</TableCell>
                                      <TableCell>{employee.login?.userName || "NA"}</TableCell>
                                      <TableCell>
                                          <Button variant="outline" size="sm">
                                              <Pencil className="w-4 h-4" />
                                          </Button>
                                          <Button variant="destructive" size="sm" onClick={() => handleDelete(employee)}>
                                              <Trash2 className="w-4 h-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>

              </CardContent>
          </Card>
      </>
    );
}

export default UserManagement;
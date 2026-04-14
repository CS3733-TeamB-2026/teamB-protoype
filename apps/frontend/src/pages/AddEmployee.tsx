"use client"
import { ChevronDown, UserPlus } from "lucide-react"
import * as React from "react"
import {
    Card,
} from "@/components/ui/card.tsx"
import { useState } from "react"
import {
    Field,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"

import { Button } from "@/components/ui/button.tsx"
import { Separator } from "@/components/ui/separator.tsx"

import { Hero } from "@/components/shared/Hero.tsx"
import { useAuth0 } from "@auth0/auth0-react";

function AddEmployee() {
    const [targetPersona, setTargetPersona] = useState("Select job position")
    const [firstName, setFirstName] = React.useState("")
    const [lastName, setLastName] = React.useState("")
    const [userName, setUserName] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [id, setID] = React.useState("")
    const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null)
    const { getAccessTokenSilently } = useAuth0();

    const handleSubmit = async () => {
        {/*TODO: This forces the user to enter all the fields, should probably do this on backend later */}
        if (!firstName || !lastName || !id || !userName || !password || targetPersona === "Select job position") {
            setSubmitResult("error")
            return
        }
            try {
            const token = await getAccessTokenSilently();
            const empRes =  await fetch('/api/employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    id: parseInt(id),
                    persona: targetPersona,
                })
            })
            if (!empRes.ok) {
                setSubmitResult("error");
                return
            }

            const loginRes = await fetch('/api/login/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userName: userName,
                    password: password,
                    employeeID: parseInt(id),
                })
            })
            if (!loginRes.ok) {
                setSubmitResult("error");
                return
            }
            setSubmitResult("success")

            setTargetPersona("Select job position")
            setFirstName("")
            setLastName("")
            setUserName("")
            setPassword("")
            setID("")
        } catch {
            setSubmitResult("error")
        }
    }
    return (

        <>

            <Hero
                title="Add Employee"
                description="Add new employee users here."
                icon={UserPlus}
            />

            {/*This gives space between the border and content*/}
            <div className="bg-secondary px-4">
                <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center mb-8">

                {/*This does the border around the screen*/}
                    <div className="px-6">

                    <>
                        {/*//Title*/}

                        <div className="bg-background py-4 text-center">
                            <h1 className="text-primary text-2xl font-semibold">Add Employees</h1>
                        </div>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary" />
                        </div>

                        {/*//Input Name Field*/}

                        {/* //TEXTBOX*/}
                        <Field className="bg-background ">
                            <FieldLabel className="text-primary" htmlFor="input-field-first-name">First Name</FieldLabel>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                id="input-field-first-name"
                                type="text"
                                placeholder="Enter your first name"
                            />
                        </Field>

                        {/*//Input Url Field*/}

                        {/* //TEXTBOX*/}
                        <Field className="bg-background ">
                            <FieldLabel className="text-primary" htmlFor="input-field-last-name">Last Name</FieldLabel>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                id="input-field-last-name"
                                type="text"
                                placeholder="Enter your last name"
                            />
                        </Field>

                        {/*//Employee ID Field*/}
                        {/*//Only allows ints*/}
                        <Field className="bg-background">
                            <FieldLabel className="text-primary" htmlFor="input-employee-id">Owner Employee ID</FieldLabel>
                            <Input
                                value={id}
                                onChange={(e) => setID(e.target.value)}
                                id="input-employee-id"
                                type="number"
                                placeholder="000000"
                            />
                            <FieldDescription>

                                {/* Enter the employee ID of the content owner*/}
                            </FieldDescription>

                        </Field>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary" />
                        </div>

                        {/*//Job position dropdown, this needs to be updated*/}

                        <Field className="bg-background">
                            <FieldLabel className="text-primary">Select job position</FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-background justify-between">
                                        {targetPersona === "underwriter" ? "Underwriter" : targetPersona === "businessAnalyst" ? "Business Analyst" : targetPersona === "admin" ? "Admin" : "Select job position"}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>Job Position</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={targetPersona} onValueChange={setTargetPersona}>
                                            <DropdownMenuRadioItem value="underwriter">Underwriter</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="businessAnalyst">Business analyst</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value={"admin"}>Admin</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary" />
                        </div>
                        {/* //TEXTBOX*/}
                        <div className="flex flex-wrap items-end gap-4 bg-background py-4">
                        <Field className="bg-background flex-1">
                            <FieldLabel className="text-primary" htmlFor="input-field-last-name">Username</FieldLabel>
                            <Input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                id="input-field-last-name"
                                type="text"
                                placeholder="Enter username"
                            />
                        </Field>

                        {/* //TEXTBOX*/}
                        <Field className="bg-background flex-1">
                            <FieldLabel className="text-primary" htmlFor="input-field-password">Password</FieldLabel>
                            <Input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                id="input-field-last-name"
                                type="text"
                                placeholder="Enter user password"
                            />
                        </Field>
                            </div>
                        {submitResult === "success" && (
                            <div className="rounded-md bg-chart-1 border-chart-2 px-3 py-2">
                                Employee created successfully!
                            </div>
                        )}

                        {submitResult === "error" && (
                            <div className="rounded-md bg-destructive border-destructive text-background px-3 py-2">
                                Error creating employee.
                            </div>
                        )}
                        <div className="flex justify-center bg-background py-4">
                            <Button onClick={handleSubmit} className="bg-accent text-white hover:bg-accent-dark hover:text-white" variant="outline" size="lg">
                                Submit
                            </Button>
                        </div>
                        </>
                </div>
                </Card>
            </div>
        </>
    )
}

export default AddEmployee;
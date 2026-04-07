"use client"
import * as React from "react"
import {
    Card,
} from "@/components/ui/card"
import { useState } from "react"
import {
    Field,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

function EmployeeForm() {
    const [targetPersona, setTargetPersona] = useState("Select job position")
    const [firstName, setFirstName] = React.useState("")
    const [lastName, setLastName] = React.useState("")
    const [userName, setUserName] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [id, setID] = React.useState("")
    const handleSubmit = async () => {
        await fetch('http://localhost:3000/api/employee', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                firstname: firstName,
                lastname: lastName,
                id: parseInt(id),
                persona: targetPersona,
            })
        })

        await fetch('http://localhost:3000/api/login/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
            userName: userName,
            password: password,
            id: parseInt(id),
            })
        })
        setTargetPersona("Select job position")
        setFirstName("")
        setLastName("")
        setUserName("")
        setPassword("")
        setID("")
    }
    return (
        /*This gives space between the border and content*/
        <div className="bg-secondary px-4">
            <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center mb-8">

            {/*This does the border around the screen*/}
                <div className="px-6">

                <>
                    {/*//Title*/}

                    <div className="bg-background py-4 text-center">
                        <h1 className="text-primary text-2xl font-semibold">Employee Management Form</h1>
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
                                <Button variant="outline">{targetPersona}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>Job Position</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={targetPersona} onValueChange={setTargetPersona}>
                                        <DropdownMenuRadioItem value="Underwriter">Underwriter</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Business analyst">Business analyst</DropdownMenuRadioItem>
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
                    <div className="flex justify-center bg-background py-4">
                        <Button onClick={handleSubmit} className="bg-primary text-white hover:bg-black hover:text-white" variant="outline" size="lg">
                            Submit
                        </Button>
                    </div>
                    </>
            </div>
            </Card>
        </div>
    )
}

export default EmployeeForm;
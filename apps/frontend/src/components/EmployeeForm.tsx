"use client"

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
    const [jobPosition, setJobPosition] = useState("Select job position")

    // Employee:
    // Fname (string)
    // Lname (string)
    // ID (number)
    // Persona (string)
    return (
        <>
            <div className="bg-secondary">
                <div className="bg-secondary py-4 text-center">
                    <h1 className="text-primary text-2xl font-semibold">Employee Management Form</h1>
                </div>
                <div className="bg-secondary py-2 px-20">
                    <Separator className="bg-primary" />
                </div>
                <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary" htmlFor="input-field-first-name">First Name</FieldLabel>
                    <Input
                        id="input-field-first-name"
                        type="text"
                        placeholder="Enter your first name"
                    />
                </Field>

                <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary" htmlFor="input-field-last-name">Last Name</FieldLabel>
                    <Input
                        id="input-field-last-name"
                        type="text"
                        placeholder="Enter your last name"
                    />
                </Field>
                <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary" htmlFor="input-employee-id">Employee ID</FieldLabel>
                    <Input id="input-employee-id" type="number" placeholder="000000" />
                    <FieldDescription>
                        Enter your employee ID
                    </FieldDescription>
                </Field>
                <div className="bg-secondary py-2 px-6">
                    <Separator className="bg-primary" />
                </div>
                <Field className="bg-white shadow-sm max-w-lg mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary">Select job position</FieldLabel>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">{jobPosition}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Job Position</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={jobPosition} onValueChange={setJobPosition}>
                                    <DropdownMenuRadioItem value="Underwriter">Underwriter</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Business analyst">Business analyst</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Field>
            </div>
        </>
    )
}

export default EmployeeForm;
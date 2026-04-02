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

    return (
        /*This gives space between the border and content*/
        <div className = "bg-secondary px-4">
            {/*This does the border around the screen*/}
            <div className="mx-auto mt-6 mb-3 max-w-6xl rounded-2xl border-2 border-primary bg-secondary p-4 shadow-lg">

                <>
                    {/*//Title*/}

                    <div className="bg-secondary py-4 text-center">
                        <h1 className="text-primary text-2xl font-semibold">Employee Management Form</h1>
                    </div>
                    <div className="bg-secondary py-2">
                        <Separator className="bg-primary" />
                    </div>

                    {/*//Input Name Field*/}

                    {/* //TEXTBOX*/}
                    <Field className="bg-secondary ">
                        <FieldLabel className="text-primary" htmlFor="input-field-first-name">First Name</FieldLabel>
                        <Input
                            id="input-field-first-name"
                            type="text"
                            placeholder="Enter your first name"
                        />
                    </Field>

                    {/*//Input Url Field*/}

                    {/* //TEXTBOX*/}
                    <Field className="bg-secondary ">
                        <FieldLabel className="text-primary" htmlFor="input-field-last-name">Last Name</FieldLabel>
                        <Input
                            id="input-field-last-name"
                            type="text"
                            placeholder="Enter your last name"
                        />
                    </Field>

                    {/*//Employee ID Field*/}
                    {/*//Only allows ints*/}
                    <Field className="bg-secondary">
                        <FieldLabel className="text-primary" htmlFor="input-employee-id">Owner Employee ID</FieldLabel>
                        <Input id="input-employee-id" type="number" placeholder="000000" />
                        <FieldDescription>

                            {/* Enter the employee ID of the content owner*/}
                        </FieldDescription>

                    </Field>
                    <div className="bg-secondary py-2">
                        <Separator className="bg-primary" />
                    </div>

                    {/*//Job position dropdown, this needs to be updated*/}

                    <Field className="bg-secondary">
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

                    <div className="flex justify-center bg-secondary py-4">
                        <Button className="bg-primary text-white hover:bg-black hover:text-white" variant="outline" size="lg">
                            Submit
                        </Button>
                    </div>
                    </>
            </div>
        </div>
    )
}

export default EmployeeForm;
"use client"
import * as React from "react"
import { format } from "date-fns"
import { useState } from "react"
import {
    Field,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

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

function ManagementForm() {
    const [jobPosition, setJobPosition] = useState("Select job position")
    const [date, setDate] = React.useState<Date>()
    const [secondDate, setSecondDate] = React.useState<Date>()
    const [thirdDate, setThirdDate] = React.useState<Date>()
    const [docType, setDocType] = useState("Select Document Type")
    const [docStatus, setDocStatus] = useState("Select Document Status")

    return (
        <>
            <div className="bg-secondary">
                <div className="bg-secondary py-4 text-center">
                    <h1 className="text-primary text-2xl font-semibold">File Management Form</h1>
                </div>
                <div className="bg-secondary py-2 px-20">
                    <Separator className="bg-primary" />
                </div>
                <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary" htmlFor="input-field-name">Name</FieldLabel>
                    <Input
                        id="input-field-name"
                        type="text"
                        placeholder="Enter your name"
                    />
                </Field>

                <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary" htmlFor="input-field-url">URL</FieldLabel>
                    <Input
                        id="input-field-url"
                        type="text"
                        placeholder="Enter the URL of the link"
                    />
                </Field>
                <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary" htmlFor="input-employee-id">Owner Employee ID</FieldLabel>
                    <Input id="input-employee-id" type="number" placeholder="000000" />
                    <FieldDescription>
                        Enter the employee ID of the content owner
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
                <div className="bg-secondary py-2 px-6">
                    <Separator className="bg-primary" />
                </div>
                <div className="mx-auto flex w-full gap">
                    <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4 flex-1">
                        <FieldLabel className="text-primary" htmlFor="date-picker-lastmodified">Last Modified Date</FieldLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    id="date-picker-lastmodified"
                                    className="w-full justify-start font-normal"
                                >
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    defaultMonth={date}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>

                    <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4 flex-1">
                        <FieldLabel className="text-primary" htmlFor="date-picker-expirationdate">Expiration Date</FieldLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    id="date-picker-expirationdate"
                                    className="w-full justify-start font-normal"
                                >
                                    {secondDate ? format(secondDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={secondDate}
                                    onSelect={setSecondDate}
                                    defaultMonth={secondDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>
                    <Field className="bg-white shadow-sm max-w-md mx-auto p-4 rounded-lg my-4 flex-1">
                        <FieldLabel className="text-primary" htmlFor="date-picker-createddate">Creation Date</FieldLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    id="date-picker-createddate"
                                    className="w-full justify-start font-normal"
                                >
                                    {thirdDate ? format(thirdDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={thirdDate}
                                    onSelect={setThirdDate}
                                    defaultMonth={thirdDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>
                </div>
                <div className="bg-secondary py-2 px-6">
                    <Separator className="bg-primary" />
                </div>
                <Field className="bg-white shadow-sm max-w-xl mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary">Type of Document</FieldLabel>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">{docType}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Document Type</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={docType} onValueChange={setDocType}>
                                    <DropdownMenuRadioItem value="Reference Content">Reference Content</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Workflow Content">Workflow Content</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Field>
                <Field className="bg-white shadow-sm max-w-xl mx-auto p-4 rounded-lg my-4">
                    <FieldLabel className="text-primary">Document Status</FieldLabel>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">{docStatus}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Document Status</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={docStatus} onValueChange={setDocStatus}>
                                    <DropdownMenuRadioItem value="New">New</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Waiting">Waiting</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="In Progress">In Progress</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Complete">Complete</DropdownMenuRadioItem>

                                </DropdownMenuRadioGroup>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Field>
                <div className="flex justify-center bg-secondary py-4">
                    <Button className="shadow-sm bg-white text-black hover:bg-primary hover:text-white" variant="outline" size="lg">
                        Submit
                    </Button>
                </div>
            </div>
        </>
    )
}

export default ManagementForm
"use client"
import * as React from "react"
import {useState} from "react"
import {
    Field,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {Calendar} from "@/components/ui/calendar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {Button} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import {
    Card,
} from "@/components/ui/card"

function ManagementForm() {
    const [jobPosition, setJobPosition] = useState("Select job position")
    const [docType, setDocType] = useState("Select Document Type")
    const [docStatus, setDocStatus] = useState("Select Document Status")
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [open2, setOpen2] = React.useState(false)
    const [date2, setDate2] = React.useState<Date | undefined>(undefined)
    const [lastModifiedTime, setLastModifiedTime] = React.useState(
        () => new Date().toTimeString().substring(0, 8)
    )


    return (

        /*This gives space between the border and content*/
        <div className="bg-secondary px-4">
            {/*This does the border around the screen*/}
            <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center mb-8">
                <div className="px-6">
                    <>
                        {/*//Title*/}

                        <div className="bg-background py-4 text-center">
                            <h1 className="text-primary text-2xl font-semibold">Content Management Form</h1>
                        </div>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>
                        {/*//Input Name Field*/}
                        {/* //TEXTBOX*/}
                        <Field className="bg-background ">
                            {/* //Primary Color and input field*/}
                            <FieldLabel className="text-primary" htmlFor="input-field-name">Name</FieldLabel>
                            <Input
                                id="input-field-name"
                                type="text"
                                placeholder="Enter your name"
                            />
                        </Field>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>
                        {/*//Input Url Field*/}
                        <div className="flex gap-4">
                            {/* //TEXTBOX*/}
                            <Field className="bg-background ">
                                <FieldLabel className="text-primary" htmlFor="input-field-url">URL</FieldLabel>
                                <Input
                                    id="input-field-url"
                                    type="text"
                                    placeholder="Enter the URL of the link"
                                />
                            </Field>
                            <Separator className="bg-primary" orientation="vertical"/>
                            {/*//File upload field*/}

                            <Field className="bg-background">
                                <FieldLabel className="text-primary" htmlFor="File">File Upload</FieldLabel>
                                <Input id="File" type="file"/>
                                <FieldDescription>Select a file to upload.</FieldDescription>
                            </Field>
                        </div>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*//Employee ID Field*/}

                        {/*//Only allows ints*/}
                        <Field className="bg-background">
                            <FieldLabel className="text-primary" htmlFor="input-employee-id">Owner Employee
                                ID</FieldLabel>
                            <Input id="input-employee-id" type="number" placeholder="000000"/>
                            <FieldDescription>

                                {/* Enter the employee ID of the content owner*/}
                            </FieldDescription>

                        </Field>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*//Job position dropdown, this needs to be updated*/}

                        <Field className="bg-background">
                            <FieldLabel className="text-primary">Select job position</FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">{jobPosition}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>Job Position</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={jobPosition} onValueChange={setJobPosition}>
                                            <DropdownMenuRadioItem
                                                value="Underwriter">Underwriter</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Business analyst">Business
                                                analyst</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/* //Date Picker Region*/}

                        <div className="flex flex-wrap items-end gap-4 bg-background py-4">

                            {/* //Last modified date*/}

                            <Field className="bg-background flex-1">
                                <FieldLabel className="text-primary" htmlFor="date">Last Modified Date</FieldLabel>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="date"
                                            className="justify-start font-normal"
                                        >
                                            {date ? date.toLocaleDateString() : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            defaultMonth={date}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setDate(date)
                                                setOpen(false)
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </Field>

                            {/* //Time picker last modified*/}
                            <Field className="w-32">
                                <FieldLabel className="text-primary"
                                            htmlFor="time-picker-lastmodified">Time</FieldLabel>
                                <Input
                                    type="time"
                                    id="time-picker-lastmodified"
                                    step="1"
                                    value={lastModifiedTime}
                                    onChange={(e) => setLastModifiedTime(e.target.value)}
                                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </Field>
                            <Separator className="bg-primary" orientation="vertical"/>

                            {/*  //Expiration Date Picker*/}
                            <Field className="bg-background flex-1">
                                <FieldLabel className="text-primary" htmlFor="date-picker-expirationdate">Expiration
                                    Date</FieldLabel>
                                <Popover open={open2} onOpenChange={setOpen2}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="date-picker-expirationdate"
                                            className="justify-start font-normal"
                                        >
                                            {date2 ? date2.toLocaleDateString() : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date2}
                                            defaultMonth={date2}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setDate2(date)
                                                setOpen2(false)
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </Field>

                            {/*  //Time Picker Expiration Date*/}

                            <Field className="w-32">
                                <FieldLabel className="text-primary"
                                            htmlFor="time-picker-expirationdate">Time</FieldLabel>
                                <Input
                                    type="time"
                                    id="time-picker-expirationdate"
                                    step="1"
                                    defaultValue="10:30:00"
                                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </Field>

                            {/* //Creation Date Section*/}


                            {/* Creation date selection*/}


                        </div>
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/* //Type of document dropdown*/}

                        <Field className="bg-background">
                            <FieldLabel className="text-primary">Type of Document</FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">{docType}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>Document Type</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={docType} onValueChange={setDocType}>
                                            <DropdownMenuRadioItem value="Reference Content">Reference
                                                Content</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Workflow Content">Workflow
                                                Content</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>

                        {/*//Document Status dropdown*/}

                        <Field className="bg-background">
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
                                            <DropdownMenuRadioItem value="In Progress">In
                                                Progress</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Done">Complete</DropdownMenuRadioItem>

                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>

                        {/* Submit button*/}

                        <div className="flex justify-center bg-background py-4">
                            <Button className="bg-primary text-background hover:bg-black hover:text-background"
                                    variant="outline"
                                    size="lg">
                                Submit
                            </Button>
                        </div>
                    </>
                </div>
            </Card>
        </div>
    )
}

export default ManagementForm
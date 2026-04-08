"use client";
import * as React from "react";
import {useState} from "react";
import {Field, FieldLabel, FieldDescription} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {Card} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {ChevronDown} from "lucide-react";

function ManagementForm() {
    const [name, setName] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [ownerID, setOwnerID] = useState("");
    const [contentType, setContentType] = useState<"reference" | "workflow">(
        "reference",
    );
    const [status, setStatus] = useState<"new" | "inProgress" | "complete">(
        "new",
    );
    const [expirationTime, setExpirationTime] = useState(() =>
        new Date().toTimeString().substring(0, 8),
    );
    const [jobPosition, setJobPosition] = useState("Select job position");
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [open2, setOpen2] = React.useState(false);
    const [date2, setDate2] = React.useState<Date | undefined>(undefined);
    const [lastModifiedTime, setLastModifiedTime] = React.useState(() =>
        new Date().toTimeString().substring(0, 8),
    );
    const [fileKey, setFileKey] = useState(0);
    const [uploadMode, setUploadMode] = React.useState<"url" | "file">("url");
    const [file, setFile] = React.useState<File | null>(null);
    const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null)

    // Function to handle post requests to backend
    const handleSubmit = async () => {
        try {

            const formData = new FormData();
            formData.append("name", name);
            formData.append("linkURL", uploadMode === "url" ? linkUrl : "");
            formData.append("ownerID", ownerID);
            formData.append("contentType", contentType);
            formData.append("status", status);
            formData.append("lastModified", date?.toISOString() ?? "");
            formData.append("expiration", date2?.toISOString() ?? "");
            formData.append("jobPosition", jobPosition);

            if (uploadMode === "file" && file) {
                formData.append("file", file);
            }

            const res = await fetch("http://localhost:3000/api/content", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error()


            if (res.status === 201) {
                setSubmitResult("success")
                setName("");
                setLinkUrl("");
                setOwnerID("");
                setContentType("reference");
                setStatus("new");
                setJobPosition("Select job position");
                setDate(new Date());
                setDate2(undefined);
                setLastModifiedTime(new Date().toTimeString().substring(0, 8));
                setExpirationTime(new Date().toTimeString().substring(0, 8));
                setFileKey((prev) => prev + 1);
                setFile(null);
            }
        }catch {
                setSubmitResult("error")
            }
    };

    return (
        /*This gives space between the border and content*/
        <div className="bg-secondary px-4">
            {/*This does the border around the screen*/}
            <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center mb-8">
                <div className="px-6">
                    <>
                        {/*Title*/}
                        <div className="bg-background py-4 text-center">
                            <h1 className="text-primary text-2xl font-semibold">
                                Content Management Form
                            </h1>
                        </div>

                        {/*Separator*/}
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*Input Name Field*/}
                        {/*TEXTBOX*/}
                        <Field className="bg-background ">
                            {/*Primary Color and input field*/}
                            <FieldLabel
                                className="text-primary"
                                htmlFor="input-field-name"
                            >
                                Name
                            </FieldLabel>
                            <Input
                                id="input-field-name"
                                type="text"
                                placeholder="Enter document name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Field>

                        {/*Separator*/}
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*Content source selector*/}
                        <div className="flex gap-4">
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">
                                    Content Source
                                </FieldLabel>
                                <RadioGroup
                                    value={uploadMode}
                                    onValueChange={(v) =>
                                        setUploadMode(v as "url" | "file")
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value="url"
                                            id="mode-url"
                                        />
                                        <Label htmlFor="mode-url">URL</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value="file"
                                            id="mode-file"
                                        />
                                        <Label htmlFor="mode-file">
                                            File Upload
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </Field>

                            <Separator
                                className="bg-primary"
                                orientation="vertical"
                            />

                            {uploadMode === "url" ? (
                                <Field className="bg-background ">
                                    {/*Input Url Field*/}
                                    <FieldLabel
                                        className="text-primary"
                                        htmlFor="input-field-url"
                                    >
                                        URL
                                    </FieldLabel>
                                    <Input
                                        id="input-field-url"
                                        type="text"
                                        placeholder="Enter the URL of the link"
                                        value={linkUrl}
                                        onChange={(e) =>
                                            setLinkUrl(e.target.value)
                                        }
                                    />
                                </Field>
                            ) : (
                                <Field className="bg-background">
                                    {/*File upload field*/}
                                    <FieldLabel
                                        className="text-primary"
                                        htmlFor="file"
                                    >
                                        File Upload
                                    </FieldLabel>
                                    <Input
                                        key={fileKey}
                                        id="file"
                                        type="file"
                                        onChange={(e) =>
                                            setFile(e.target.files?.[0] ?? null)
                                        }
                                    />
                                    <FieldDescription>
                                        Select a file to upload.
                                    </FieldDescription>
                                </Field>
                            )}
                        </div>

                        {/*Separator*/}
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*Employee ID Field*/}
                        {/*Only allows ints*/}
                        <Field className="bg-background">
                            <FieldLabel
                                className="text-primary"
                                htmlFor="input-employee-id"
                            >
                                Owner Employee ID
                            </FieldLabel>
                            <Input
                                id="input-employee-id"
                                type="number"
                                placeholder="000000"
                                value={ownerID}
                                onChange={(e) => setOwnerID(e.target.value)}
                            />
                            <FieldDescription>
                                {/* TODO: Enter the employee ID of the content owner*/}
                            </FieldDescription>
                        </Field>

                        {/*Separator*/}
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*Job position dropdown, this needs to be updated*/}
                        <Field className="bg-background">
                            <FieldLabel className="text-primary">
                                Select job position
                            </FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-background justify-between">
                                        {jobPosition}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                            Job Position
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup
                                            value={jobPosition}
                                            onValueChange={setJobPosition}
                                        >
                                            <DropdownMenuRadioItem value="Underwriter">
                                                Underwriter
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Business analyst">
                                                Business analyst
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>

                        {/*Separator*/}
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*Date Picker Region*/}
                        <div className="flex flex-wrap items-end gap-4 bg-background py-4">
                            {/*Last modified date*/}
                            {/*TODO: Consider whether to do this*/}
                            <Field className="bg-background flex-1">
                                <FieldLabel
                                    className="text-primary"
                                    htmlFor="date"
                                >
                                    Last Modified Date
                                </FieldLabel>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="date"
                                            className="justify-start font-normal"
                                        >
                                            {date
                                                ? date.toLocaleDateString()
                                                : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            defaultMonth={date}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setDate(date);
                                                setOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </Field>

                            {/*Time picker last modified*/}
                            <Field className="w-32">
                                <FieldLabel
                                    className="text-primary"
                                    htmlFor="time-picker-lastmodified"
                                >
                                    Time
                                </FieldLabel>
                                <Input
                                    type="time"
                                    id="time-picker-lastmodified"
                                    step="1"
                                    value={lastModifiedTime}
                                    onChange={(e) =>
                                        setLastModifiedTime(e.target.value)
                                    }
                                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </Field>
                            <Separator
                                className="bg-primary"
                                orientation="vertical"
                            />

                            {/*Expiration Date Picker*/}
                            <Field className="bg-background flex-1">
                                <FieldLabel
                                    className="text-primary"
                                    htmlFor="date-picker-expirationdate"
                                >
                                    Expiration Date
                                </FieldLabel>
                                <Popover open={open2} onOpenChange={setOpen2}>
                                    <PopoverTrigger asChild>
                                        <Button

                                            variant="outline"
                                            id="date-picker-expirationdate"
                                            className="justify-start font-normal"
                                        >
                                            {date2
                                                ? date2.toLocaleDateString()
                                                : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date2}
                                            defaultMonth={date2}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setDate2(date);
                                                setOpen2(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </Field>

                            {/*Time Picker Expiration Date*/}
                            <Field className="w-32">
                                <FieldLabel
                                    className="text-primary"
                                    htmlFor="time-picker-expirationdate"
                                >
                                    Time
                                </FieldLabel>
                                <Input
                                    type="time"
                                    id="time-picker-expirationdate"
                                    step="1"
                                    value={expirationTime}
                                    onChange={(e) =>
                                        setExpirationTime(e.target.value)
                                    }

                                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </Field>
                        </div>

                        {/*Separator*/}
                        <div className="bg-background py-2">
                            <Separator className="bg-primary"/>
                        </div>

                        {/*Type of document dropdown*/}
                        <Field className="bg-background">
                            <FieldLabel className="text-primary">
                                Type of Document
                            </FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-background justify-between">
                                    {contentType === "reference"
                                            ? "Reference Content"
                                            : "Workflow Content"}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                            Document Type
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup
                                            value={contentType}
                                            onValueChange={(v) =>
                                                setContentType(
                                                    v as
                                                        | "reference"
                                                        | "workflow",
                                                )
                                            }
                                        >
                                            <DropdownMenuRadioItem value="reference">
                                                Reference Content
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="workflow">
                                                Workflow Content
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>

                        {/*Document Status dropdown*/}
                        <Field className="bg-background">
                            <FieldLabel className="text-primary">
                                Document Status
                            </FieldLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-background justify-between">
                                        {status === "new"
                                            ? "New"
                                            : status === "inProgress"
                                                ? "In Progress"
                                                : "complete"}
                                        <ChevronDown className="h-4 w-4" />

                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                            Document Status
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup
                                            value={status}
                                            onValueChange={(v) =>
                                                setStatus(
                                                    v as
                                                        | "new"
                                                        | "inProgress"
                                                        | "complete",
                                                )
                                            }
                                        >
                                            <DropdownMenuRadioItem value="new">
                                                New
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="inProgress">
                                                In Progress
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="complete">
                                                Complete
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Field>
                        {submitResult === "success" && (
                            <div className="mt-4 rounded-md bg-chart-1 border-chart-2 px-3 py-2">
                                Content created successfully!
                            </div>
                        )}

                        {submitResult === "error" && (
                            <div className="mt-4 rounded-md bg-destructive border-destructive text-background px-3 py-2">
                                Error creating content.
                            </div>
                        )}
                        {/*Submit button*/}
                        <div className="flex justify-center bg-background py-4">
                            <Button
                                onClick={handleSubmit}
                                className="bg-primary text-background hover:bg-black hover:text-background"
                                variant="outline"
                                size="lg"
                            >
                                Submit
                            </Button>
                        </div>
                    </>
                </div>
            </Card>
        </div>
    );
}

export default ManagementForm;

"use client";
import * as React from "react";
import {useState} from "react";
import {Field, FieldLabel, FieldDescription} from "@/components/ui/field.tsx";
import {Input} from "@/components/ui/input.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover.tsx";
import {Calendar} from "@/components/ui/calendar.tsx";
import { Hero } from "@/components/shared/Hero.tsx"
import { FilePlus } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {Button} from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { ALLOWED_ACCEPT_STRING, validateFileForUpload } from "@/helpers/mime.ts";

import {Separator} from "@/components/ui/separator.tsx";
import { Card } from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {ChevronDown, Loader2, TriangleAlert} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { ContentIcon } from "@/components/shared/ContentIcon.tsx";

type UrlPreview = {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
};

function AddContent() {
    const [user] = useUser();
    const [name, setName] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [ownerID, setOwnerID] = useState(user?.id ?? 0);
    const [contentType, setContentType] = useState<"reference" | "workflow">(
        "reference",
    );
    const [status, setStatus] = useState<"new" | "inProgress" | "complete">(
        "new",
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
    const [filePickError, setFilePickError] = useState<string | null>(null);
    const [urlStatus, setUrlStatus] = useState<"idle" | "loading" | "unreachable" | "ok">("idle");
    const [urlPreview, setUrlPreview] = useState<UrlPreview | null>(null);
    const [ogImageError, setOgImageError] = useState(false);
    const [faviconError, setFaviconError] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null)

    function isValidUrl(url: string): boolean {
        try { new URL(url); return true; } catch { return false; }
    }

    function getErrors() {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Name is required.";
        if (uploadMode === "url") {
            if (!linkUrl.trim()) e.source = "URL is required.";
            else if (!isValidUrl(linkUrl)) e.source = "Please enter a valid URL.";
        }
        if (uploadMode === "file" && !file) e.source = "Please select a file.";
        if (jobPosition === "Select job position") e.persona = "Please select a job position.";
        return e;
    }

    const handleUrlBlur = async () => {
        if (!linkUrl.trim() || !isValidUrl(linkUrl)) return;
        setUrlStatus("loading");
        try {
            const res = await fetch(`/api/preview?url=${encodeURIComponent(linkUrl)}`);
            if (!res.ok) {
                setUrlStatus("unreachable");
                return;
            }
            const data: UrlPreview = await res.json();
            setUrlPreview(data);
            setUrlStatus("ok");
            if (data.title) setName(data.title);
        } catch {
            setUrlStatus("unreachable");
        }
    };

    const errors = submitted ? getErrors() : {};

    const handleFileChange = (file: File | null) => {
        setFilePickError(null);
        if (!file) {
            setFile(null);
            return;
        }

        const validation = validateFileForUpload(file);
        if (!validation.ok) {
            setFilePickError(validation.reason);
            setFile(null);
            return;
        }

        setFile(file);
        setName(file.name);
        const lastMod = new Date(file.lastModified);
        setDate(lastMod);
        setLastModifiedTime(lastMod.toTimeString().substring(0, 8));
    }

    // Function to handle post requests to backend
    const handleSubmit = async () => {
        setSubmitted(true);
        if (Object.keys(getErrors()).length > 0) return;


        try {

            const formData = new FormData();
            formData.append("name", name);
            formData.append("linkURL", uploadMode === "url" ? linkUrl : "");
            formData.append("ownerID", ownerID.toString());
            formData.append("contentType", contentType);
            formData.append("status", status);
            const lastModifiedDate = date ? new Date(date) : new Date();
            const [lmh, lmm, lms] = lastModifiedTime.split(":").map(Number);
            lastModifiedDate.setHours(lmh, lmm, lms ?? 0, 0);
            formData.append("lastModified", lastModifiedDate.toISOString());
            if (date2) {
                const expDate = new Date(date2);
                expDate.setHours(0, 0, 0, 0);
                formData.append("expiration", expDate.toISOString());
            } else {
                formData.append("expiration", "");
            }
            formData.append("jobPosition", jobPosition);

            if (uploadMode === "file" && file) {
                formData.append("file", file);
            }

            const res = await fetch("/api/content", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                setSubmitResult("error");
                return
            }

            if (res.status === 201) {
                setSubmitResult("success")
                setName("");
                setLinkUrl("");
                setOwnerID(user?.id ?? 0);
                setContentType("reference");
                setStatus("new");
                setJobPosition("Select job position");
                setDate(new Date());
                setDate2(undefined);
                setLastModifiedTime(new Date().toTimeString().substring(0, 8));
                setFileKey((prev) => prev + 1);
                setFile(null);
                setSubmitted(false);
            }
        } catch {
            setSubmitResult("error")
        }
    };

    if (!user) return null;

    return (

        <>

            <Hero
                title="Add Content"
                description="Add new content here."
                icon={ FilePlus }
            />

            {/*This gives space between the border and content*/}
            <div className="bg-secondary px-4">
                {/*This does the border around the screen*/}
                <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center mb-8">
                    <div className="px-6">
                        <>
                            {/*Title*/}
                            <div className="bg-background py-4 text-center">
                                <h1 className="text-primary text-2xl font-semibold">
                                    Add Content
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
                                    Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    id="input-field-name"
                                    type="text"
                                    placeholder="Enter document name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                {errors.name && <FieldDescription className="text-destructive">{errors.name}</FieldDescription>}
                            </Field>

                            {/*Separator*/}
                            <div className="bg-background py-2">
                                <Separator className="bg-primary"/>
                            </div>

                            {/*Content source selector*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">
                                    Content Source <span className="text-destructive">*</span>
                                </FieldLabel>
                                <RadioGroup
                                    value={uploadMode}
                                    onValueChange={(v) => setUploadMode(v as "url" | "file")}
                                    className="flex gap-6"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="url" id="mode-url" />
                                        <Label htmlFor="mode-url">URL</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="file" id="mode-file" />
                                        <Label htmlFor="mode-file">File Upload</Label>
                                    </div>
                                </RadioGroup>

                                {uploadMode === "url" ? (
                                    <>
                                        <Input
                                            id="input-field-url"
                                            type="text"
                                            placeholder="Enter the URL of the link"
                                            value={linkUrl}
                                            onChange={(e) => {
                                                setLinkUrl(e.target.value);
                                                setUrlStatus("idle");
                                                setUrlPreview(null);
                                                setOgImageError(false);
                                                setFaviconError(false);
                                            }}
                                            onBlur={handleUrlBlur}
                                        />
                                        {errors.source && <FieldDescription className="text-destructive">{errors.source}</FieldDescription>}
                                        {urlStatus === "loading" && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Fetching preview...
                                            </div>
                                        )}
                                        {urlStatus === "unreachable" && (
                                            <div className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
                                                <TriangleAlert className="h-4 w-4 shrink-0" />
                                                URL may be unreachable or doesn't support previews.
                                            </div>
                                        )}
                                        {urlStatus === "ok" && urlPreview && (
                                            <Card className="text-left p-4">
                                                <div className="flex items-center gap-4">
                                                    {urlPreview.image && !ogImageError ? (
                                                        <img
                                                            src={urlPreview.image}
                                                            alt=""
                                                            className="w-16 h-16 rounded object-cover shrink-0"
                                                            onError={() => setOgImageError(true)}
                                                        />
                                                    ) : urlPreview.favicon && !faviconError ? (
                                                        <img
                                                            src={urlPreview.favicon}
                                                            alt=""
                                                            className="w-8 h-8 rounded shrink-0"
                                                            onError={() => setFaviconError(true)}
                                                        />
                                                    ) : (
                                                        <ContentIcon category="other" isLink={true} className="w-8 h-8" />
                                                    )}
                                                    <div className="min-w-0">
                                                        {urlPreview.siteName && <p className="text-xs text-muted-foreground">{urlPreview.siteName}</p>}
                                                        {urlPreview.title && <p className="text-sm font-medium text-foreground truncate">{urlPreview.title}</p>}
                                                        {urlPreview.description && <p className="text-xs text-muted-foreground line-clamp-2">{urlPreview.description}</p>}
                                                    </div>
                                                </div>
                                            </Card>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Input
                                            key={fileKey}
                                            id="file"
                                            type="file"
                                            accept={ALLOWED_ACCEPT_STRING}
                                            onChange={(e) =>
                                                handleFileChange(e.target.files?.[0] ?? null)
                                            }
                                        />
                                        {(filePickError || errors.source) ? (
                                            <FieldDescription className="text-destructive">
                                                {filePickError ?? errors.source}
                                            </FieldDescription>
                                        ) : (
                                            <FieldDescription>
                                                Select a file to upload.
                                            </FieldDescription>
                                        )}
                                    </>
                                )}
                            </Field>

                            {/*Separator*/}
                            <div className="bg-background py-2">
                                <Separator className="bg-primary"/>
                            </div>

                            {/*Employee ID Field*/}
                            {/*Only allows ints*/}
                            {/*<Field className="bg-background">*/}
                            {/*    <Input*/}
                            {/*        id="input-employee-id"*/}
                            {/*        type="number"*/}
                            {/*        placeholder="000000"*/}
                            {/*        value={ownerID}*/}
                            {/*        onChange={(e) => setOwnerID(e.target.value)}*/}
                            {/*    />*/}
                            {/*    <FieldDescription>*/}
                            {/*        /!* TODO: Enter the employee ID of the content owner*!/*/}
                            {/*    </FieldDescription>*/}
                            {/*</Field>*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">
                                    Owner Employee
                                </FieldLabel>
                                <Card className="text-left p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {user.firstName[0] + user.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{user.firstName} {user.lastName}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{user.persona}</p>
                                        </div>
                                    </div>
                                </Card>
                            </Field>

                            {/*Separator*/}
                            <div className="bg-background py-2">
                                <Separator className="bg-primary"/>
                            </div>

                            {/*Job position dropdown, this needs to be updated*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">
                                    Target Persona <span className="text-destructive">*</span>
                                </FieldLabel>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="bg-background justify-between">
                                            {jobPosition === "underwriter" ? "Underwriter" : jobPosition === "businessAnalyst" ? "Business Analyst" : jobPosition === "admin" ? "Admin" : "Select job position"}
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
                                                <DropdownMenuRadioItem value="underwriter">
                                                    Underwriter
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="businessAnalyst">
                                                    Business Analyst
                                                </DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="admin">
                                                    Admin
                                                </DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {errors.persona && <FieldDescription className="text-destructive">{errors.persona}</FieldDescription>}
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
                                                    setContentType(v as "reference" | "workflow")
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
                                                    : "Complete"}
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
                                                    setStatus(v as "new" | "inProgress" | "complete")
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
                                    disabled={submitted && Object.keys(getErrors()).length > 0}
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
        </>
    );
}

export default AddContent;

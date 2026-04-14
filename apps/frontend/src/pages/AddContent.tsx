"use client";
import * as React from "react";
import { useState } from "react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { FilePlus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { ALLOWED_ACCEPT_STRING, validateFileForUpload, stripExtension } from "@/helpers/mime.ts";
import { Separator } from "@/components/ui/separator.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { UrlSourceField } from "@/components/shared/UrlSourceField.tsx";
import { FilePickerCard } from "@/components/shared/FilePickerCard.tsx";

type ContentFormValues = {
    name: string;
    linkUrl: string;
    ownerID: number;
    contentType: "reference" | "workflow" | "";
    status: "new" | "inProgress" | "complete";
    jobPosition: string;
    uploadMode: "url" | "file";
    file: File | null;
    dateModified: Date | undefined;
    lastModifiedTime: string;
    dateExpiration: Date | undefined;
};

function nowTimeString(): string {
    return new Date().toTimeString().substring(0, 8);
}

function isValidUrl(url: string): boolean {
    try { new URL(url); return true; } catch { return false; }
}

function initialValues(userId: number): ContentFormValues {
    return {
        name: "",
        linkUrl: "",
        ownerID: userId,
        contentType: "",
        status: "new",
        jobPosition: "",
        uploadMode: "url",
        file: null,
        dateModified: new Date(),
        lastModifiedTime: nowTimeString(),
        dateExpiration: undefined,
    };
}

function AddContent() {
    const [user] = useUser();
    const [values, setValues] = useState<ContentFormValues>(() => initialValues(user?.id ?? 0));
    const patch = (p: Partial<ContentFormValues>) => setValues(prev => ({ ...prev, ...p }));

    // UI-only state
    const [openModifiedDate, setOpenModifiedDate] = React.useState(false);
    const [openExpirationDate, setOpenExpirationDate] = React.useState(false);
    const [filePickError, setFilePickError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    function getErrors() {
        const e: Record<string, string> = {};
        if (!values.name.trim()) e.name = "Name is required.";
        if (values.uploadMode === "url") {
            if (!values.linkUrl.trim()) e.source = "URL is required.";
            else if (!isValidUrl(values.linkUrl)) e.source = "Please enter a valid URL.";
        }
        if (values.uploadMode === "file" && !values.file) e.source = "Please select a file.";
        if (!values.jobPosition) e.persona = "Please select a job position.";
        if (!values.contentType) e.contentType = "Please select a document type.";
        return e;
    }

    const errors = submitted ? getErrors() : {};

    const handleFileChange = (file: File | null) => {
        setFilePickError(null);
        if (!file) { patch({ file: null }); return; }

        const validation = validateFileForUpload(file);
        if (!validation.ok) {
            setFilePickError(validation.reason);
            patch({ file: null });
            return;
        }

        const lastMod = new Date(file.lastModified);
        patch({
            file,
            name: stripExtension(file.name),
            dateModified: lastMod,
            lastModifiedTime: lastMod.toTimeString().substring(0, 8),
        });
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        if (Object.keys(getErrors()).length > 0) return;

        try {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("linkURL", values.uploadMode === "url" ? values.linkUrl : "");
            formData.append("ownerID", values.ownerID.toString());
            formData.append("contentType", values.contentType);
            formData.append("status", values.status);

            const lastModifiedDate = values.dateModified ? new Date(values.dateModified) : new Date();
            const [lmh, lmm, lms] = values.lastModifiedTime.split(":").map(Number);
            lastModifiedDate.setHours(lmh, lmm, lms ?? 0, 0);
            formData.append("lastModified", lastModifiedDate.toISOString());

            if (values.dateExpiration) {
                const expDate = new Date(values.dateExpiration);
                expDate.setHours(0, 0, 0, 0);
                formData.append("expiration", expDate.toISOString());
            } else {
                formData.append("expiration", "");
            }
            formData.append("jobPosition", values.jobPosition);
            if (values.uploadMode === "file" && values.file) {
                formData.append("file", values.file);
            }

            const res = await fetch("/api/content", { method: "POST", body: formData });
            if (!res.ok) { toast.error("Error creating content."); return; }

            toast.success("Content created successfully!");
            setValues(initialValues(user!.id));
            setSubmitted(false);
            setFilePickError(null);
        } catch {
            toast.error("Error creating content.");
        }
    };

    if (!user) return null;

    return (
        <>
            <Hero
                title="Add Content"
                description="Add new content here."
                icon={FilePlus}
            />

            <div className="bg-secondary px-4">
                <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center mb-8">
                    <div className="px-6">
                        <>
                            <div className="bg-background py-4 text-center">
                                <h1 className="text-primary text-2xl font-semibold">Add Content</h1>
                            </div>

                            <div className="bg-background py-2">
                                <Separator className="bg-primary" />
                            </div>

                            {/*Name*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary" htmlFor="input-field-name">
                                    Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    id="input-field-name"
                                    type="text"
                                    placeholder="Enter document name"
                                    value={values.name}
                                    onChange={(e) => patch({ name: e.target.value })}
                                />
                                {errors.name && <FieldDescription className="text-destructive">{errors.name}</FieldDescription>}
                            </Field>

                            <div className="bg-background py-2">
                                <Separator className="bg-primary" />
                            </div>

                            {/*Content Source*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">
                                    Content Source <span className="text-destructive">*</span>
                                </FieldLabel>
                                <RadioGroup
                                    value={values.uploadMode}
                                    onValueChange={(v) => {
                                        const mode = v as "url" | "file";
                                        patch({ uploadMode: mode });
                                        if (mode === "file" && values.file) {
                                            handleFileChange(values.file);
                                        }
                                    }}
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

                                {values.uploadMode === "url" ? (
                                    <UrlSourceField
                                        value={values.linkUrl}
                                        onChange={(url) => patch({ linkUrl: url })}
                                        onPreviewLoaded={(preview) => patch({
                                            ...(preview.title ? { name: preview.title } : {}),
                                            dateModified: new Date(),
                                            lastModifiedTime: nowTimeString(),
                                        })}
                                        error={errors.source}
                                    />
                                ) : (
                                    <FilePickerCard
                                        file={values.file}
                                        onChange={handleFileChange}
                                        error={filePickError ?? errors.source}
                                        accept={ALLOWED_ACCEPT_STRING}
                                    />
                                )}
                            </Field>

                            <div className="bg-background py-2">
                                <Separator className="bg-primary" />
                            </div>

                            {/*Owner*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">Owner Employee</FieldLabel>
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

                            <div className="bg-background py-2">
                                <Separator className="bg-primary" />
                            </div>

                            {/*Target Persona*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">
                                    Target Persona <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select value={values.jobPosition} onValueChange={(v) => patch({ jobPosition: v })}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select job position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="underwriter">Underwriter</SelectItem>
                                        <SelectItem value="businessAnalyst">Business Analyst</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.persona && <FieldDescription className="text-destructive">{errors.persona}</FieldDescription>}
                            </Field>

                            <div className="bg-background py-2">
                                <Separator className="bg-primary" />
                            </div>

                            {/*Dates*/}
                            <div className="flex flex-wrap items-end gap-4 bg-background py-4">
                                <Field className="bg-background flex-1">
                                    <FieldLabel className="text-primary" htmlFor="date">
                                        Last Modified Date
                                    </FieldLabel>
                                    <Popover open={openModifiedDate} onOpenChange={setOpenModifiedDate}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" id="date" className="justify-start font-normal" disabled={values.uploadMode === "file" && values.file !== null}>
                                                {values.dateModified ? values.dateModified.toLocaleDateString() : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={values.dateModified}
                                                defaultMonth={values.dateModified}
                                                captionLayout="dropdown"
                                                onSelect={(date) => { patch({ dateModified: date }); setOpenModifiedDate(false); }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </Field>

                                <Field className="w-32">
                                    <FieldLabel className="text-primary" htmlFor="time-picker-lastmodified">
                                        Time
                                    </FieldLabel>
                                    <Input
                                        type="time"
                                        id="time-picker-lastmodified"
                                        step="1"
                                        value={values.lastModifiedTime}
                                        onChange={(e) => patch({ lastModifiedTime: e.target.value })}
                                        disabled={values.uploadMode === "file" && values.file !== null}
                                        className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                </Field>

                                <Separator className="bg-primary" orientation="vertical" />

                                <Field className="bg-background flex-1">
                                    <FieldLabel className="text-primary" htmlFor="date-picker-expirationdate">
                                        Expiration Date
                                    </FieldLabel>
                                    <Popover open={openExpirationDate} onOpenChange={setOpenExpirationDate}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" id="date-picker-expirationdate" className="justify-start font-normal">
                                                {values.dateExpiration ? values.dateExpiration.toLocaleDateString() : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={values.dateExpiration}
                                                defaultMonth={values.dateExpiration}
                                                captionLayout="dropdown"
                                                onSelect={(date) => { patch({ dateExpiration: date }); setOpenExpirationDate(false); }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </Field>
                            </div>

                            <div className="bg-background py-2">
                                <Separator className="bg-primary" />
                            </div>

                            {/*Document Type*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">
                                    Type of Document <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select value={values.contentType} onValueChange={(v) => patch({ contentType: v as "reference" | "workflow" | "" })}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="reference">Reference Content</SelectItem>
                                        <SelectItem value="workflow">Workflow Content</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.contentType && <FieldDescription className="text-destructive">{errors.contentType}</FieldDescription>}
                            </Field>

                            {/*Document Status*/}
                            <Field className="bg-background">
                                <FieldLabel className="text-primary">Document Status</FieldLabel>
                                <Select value={values.status} onValueChange={(v) => patch({ status: v as "new" | "inProgress" | "complete" })}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="inProgress">In Progress</SelectItem>
                                        <SelectItem value="complete">Complete</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <div className="flex justify-center bg-background py-4">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={Object.keys(getErrors()).length > 0}
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

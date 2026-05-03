import { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload, X, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth0 } from "@auth0/auth0-react";
import { Hero } from "@/components/shared/Hero.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field.tsx";
import { EmployeePicker } from "@/components/shared/EmployeePicker.tsx";
import { CollectionPicker } from "@/components/shared/CollectionPicker.tsx";
import { AddCollectionDialog } from "@/features/collections/AddCollectionDialog.tsx";
import { TagInput } from "@/features/content/tags/TagInput.tsx";
import { ContentIcon } from "@/features/content/components/ContentIcon.tsx";
import {
    validateFileForUpload,
    stripExtension,
    ALLOWED_ACCEPT_STRING,
    resolveAllowedType,
    CATEGORY_COLORS,
} from "@/lib/mime.ts";
import {
    type ContentFormValues,
    buildContentFormData,
} from "@/features/content/forms/content-form.ts";
import { useUser } from "@/hooks/use-user.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import InfoButton from "@/components/layout/InformationAlert.tsx";

// ---------- Types ----------

type FileUploadStatus = "pending" | "uploading" | "success" | "error";

interface BulkFileEntry {
    id: string;
    file: File;
    /** Editable display name, pre-filled from the filename (sans extension). */
    name: string;
    status: FileUploadStatus;
    errorMessage: string | null;
}

interface BulkSharedMeta {
    targetPersona: string;
    ownerID: number | null;
    contentType: ContentFormValues["contentType"];
    status: ContentFormValues["status"];
    dateExpiration: Date | undefined;
    tags: string[];
}

// ---------- Validation ----------

function validateMeta(m: BulkSharedMeta): Record<string, string> {
    const e: Record<string, string> = {};
    if (!m.targetPersona) e.targetPersona = "Target persona is required.";
    if (m.contentType === "none") e.contentType = "Please select a document type.";
    if (m.status === "none") e.status = "Please select a status.";
    return e;
}

// ---------- Helpers ----------

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ---------- Page ----------

/**
 * Full-page bulk file upload flow.
 *
 * Users select multiple files, give each an editable display name, fill in
 * shared metadata (persona, owner, tags, type, status), then upload all files
 * sequentially. Each row shows live status as uploads progress.
 *
 * Optionally adds all successfully-uploaded items to a collection. The append
 * runs after all uploads complete — it GETs the current collection to read
 * existing item IDs, then PUTs the merged list, because the collection update
 * API replaces the full item list rather than appending.
 *
 * "Upload More" resets only the file list; shared metadata and the collection
 * selection persist so a second batch can be added to the same collection.
 */
export function BulkUploadPage() {
    usePageTitle("Bulk Upload");
    const navigate = useNavigate();
    const {user} = useUser();
    const { getAccessTokenSilently } = useAuth0();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [opening, setOpening] = useState(false);
    const [openExpiration, setOpenExpiration] = useState(false);
    const [addToCollection, setAddToCollection] = useState(false);
    const [collectionId, setCollectionId] = useState<number | null>(null);
    const [addCollectionDialogOpen, setAddCollectionDialogOpen] = useState(false);
    const [collectionRefreshKey, setCollectionRefreshKey] = useState(0); // incremented to trigger a refetch inside CollectionPicker

    const [phase, setPhase] = useState<"selection" | "uploading" | "done">("selection");
    const [entries, setEntries] = useState<BulkFileEntry[]>([]);
    const [uploadIndex, setUploadIndex] = useState(0);

    const [meta, setMeta] = useState<BulkSharedMeta>({
        targetPersona: user?.persona ?? "",
        ownerID: user?.id ?? null,
        contentType: "none",
        status: "none",
        dateExpiration: undefined,
        tags: [],
    });
    const patchMeta = (p: Partial<BulkSharedMeta>) => setMeta(prev => ({ ...prev, ...p }));

    // `submitted` gates whether validation errors are shown. Errors are always
    // computed live from current state — there's no stale error cache.
    const [submitted, setSubmitted] = useState(false);
    const [fileListError, setFileListError] = useState<string | null>(null);

    // Warn the browser if the user tries to navigate away mid-upload.
    useEffect(() => {
        if (phase !== "uploading") return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [phase]);

    // ---------- File selection ----------

    const handleAddFiles = () => {
        setOpening(true);
        fileInputRef.current?.click();
        window.addEventListener("focus", () => setOpening(false), { once: true });
    };

    const handleFilesSelected = (e: { target: HTMLInputElement }) => {
        setOpening(false);
        const newEntries: BulkFileEntry[] = [];
        for (const file of Array.from(e.target.files ?? [])) {
            const validation = validateFileForUpload(file);
            if (!validation.ok) {
                toast.error(`${file.name}: ${validation.reason}`);
                continue;
            }
            newEntries.push({
                id: crypto.randomUUID(),
                file,
                name: stripExtension(file.name),
                status: "pending",
                errorMessage: null,
            });
        }
        setEntries(prev => [...prev, ...newEntries]);
        setFileListError(null);
        // Reset so the same files can be re-selected after being removed.
        if (e.target) e.target.value = "";
    };

    const removeEntry = (id: string) => {
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    const updateEntryName = (id: string, name: string) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, name } : e));
    };

    // ---------- Upload ----------

    const handleUpload = async () => {
        setSubmitted(true);

        if (entries.length === 0) {
            setFileListError("Please add at least one file.");
            return;
        }
        if (Object.keys(validateMeta(meta)).length > 0) return;
        if (entries.some(e => !e.name.trim())) return;

        setPhase("uploading");
        setUploadIndex(0);
        const token = await getAccessTokenSilently();
        let successCount = 0;
        let failCount = 0;
        const uploadedContentIds: number[] = []; // collected for the post-upload collection append

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            setUploadIndex(i + 1);
            setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "uploading" } : e));

            const values: ContentFormValues = {
                expires: meta.dateExpiration ? "expires" : "forever",
                name: entry.name,
                linkUrl: "",
                ownerID: meta.ownerID,
                contentType: meta.contentType,
                status: meta.status,
                targetPersona: meta.targetPersona,
                uploadMode: "file",
                file: entry.file,
                dateExpiration: meta.dateExpiration,
                tags: meta.tags,
            };

            try {
                const formData = buildContentFormData(values);
                const res = await fetch("/api/content", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
                if (!res.ok) throw new Error(`Server responded with ${res.status}`);
                const created = await res.json() as { id: number };
                uploadedContentIds.push(created.id);
                setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "success" } : e));
                successCount++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Upload failed";
                setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "error", errorMessage: msg } : e));
                failCount++;
            }
        }

        if (addToCollection && collectionId != null && uploadedContentIds.length > 0) {
            try {
                const appendRes = await fetch(`/api/collections/${collectionId}/items`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ contentIds: uploadedContentIds }),
                });
                if (!appendRes.ok) throw new Error(`Failed to update collection (${appendRes.status})`);
                toast.success(`Added ${uploadedContentIds.length} item${uploadedContentIds.length !== 1 ? "s" : ""} to collection.`);
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Unknown error";
                toast.error(`Uploads succeeded but collection update failed: ${msg}`);
            }
        }

        setPhase("done");
        if (failCount === 0) {
            toast.success(`${successCount} file${successCount !== 1 ? "s" : ""} uploaded successfully.`);
        } else {
            toast.warning(`${successCount} succeeded, ${failCount} failed.`);
        }
    };

    const handleUploadMore = () => {
        setEntries([]);
        setSubmitted(false);
        setFileListError(null);
        setUploadIndex(0);
        setPhase("selection");
    };

    // Errors are computed live from current state so they clear as the user fixes
    // fields — no stale snapshot. Only shown after the first submit attempt.
    const metaErrors = submitted ? validateMeta(meta) : {};
    const uploading = phase === "uploading";

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <>
            <Hero icon={Upload} title="Bulk Upload" description="Upload multiple files at once with shared metadata." />

            <Card className="relative shadow-lg max-w-5xl mx-auto my-8 text-center px-4">
                <Link to="/files" className="absolute top-6 left-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
                    <ArrowLeft className="w-4 h-4" /> Back to files
                </Link>
                <CardHeader>
                    <CardTitle className="text-3xl text-primary">Bulk File Upload</CardTitle>
                    <CardDescription>
                        Add files below, set a display name for each, fill in the shared metadata, then click Upload All.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col">

                        {/* ── File list ── */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-primary">Files</h2>
                                {/* "Add more" button — only shown once files are already present,
                                    since the empty-state drop zone handles the initial add. */}
                                {phase === "selection" && entries.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2 border-dashed"
                                        onClick={handleAddFiles}
                                        disabled={opening}
                                    >
                                        {opening
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Upload className="w-4 h-4" />
                                        }
                                        {opening ? "Opening…" : "Add more…"}
                                    </Button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={ALLOWED_ACCEPT_STRING}
                                className="hidden"
                                onChange={handleFilesSelected}
                            />

                            {fileListError && (
                                <p className="text-sm text-destructive">{fileListError}</p>
                            )}

                            {entries.length === 0 ? (
                                <Card
                                    onClick={phase === "selection" && !opening ? handleAddFiles : undefined}
                                    className={[
                                        "flex flex-col items-center justify-center gap-2 border-2 border-dashed py-16 transition-colors",
                                        phase === "selection" && !opening
                                            ? "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary cursor-pointer"
                                            : "border-muted-foreground/20 text-muted-foreground/50 pointer-events-none opacity-50",
                                    ].join(" ")}
                                >
                                    {opening
                                        ? <Loader2 className="w-8 h-8 animate-spin" />
                                        : <Upload className="w-8 h-8" />
                                    }
                                    <span className="text-sm">{opening ? "Opening…" : "Click to add files"}</span>
                                </Card>
                            ) : (
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10"></TableHead>
                                                <TableHead>Display Name</TableHead>
                                                <TableHead className="hidden sm:table-cell">Original File</TableHead>
                                                <TableHead className="hidden sm:table-cell w-20">Size</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entries.map(entry => {
                                                const allowed = resolveAllowedType(entry.file.type, entry.file.name);
                                                const category = allowed?.category ?? "other";
                                                const colors = CATEGORY_COLORS[category];
                                                const nameError = submitted && !entry.name.trim();
                                                return (
                                                    <TableRow key={entry.id}>
                                                        <TableCell>
                                                            <div className={`flex items-center justify-center w-8 h-8 rounded ${colors.badge} shrink-0`}>
                                                                <ContentIcon category={category} isLink={false} className="w-4 h-4" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                value={entry.name}
                                                                onChange={e => updateEntryName(entry.id, e.target.value)}
                                                                disabled={uploading || entry.status === "success"}
                                                                className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
                                                                placeholder="Display name"
                                                            />
                                                            {nameError && (
                                                                <p className="text-xs text-destructive mt-1">Name is required.</p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-40 truncate">
                                                            {entry.file.name}
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                                            {formatFileSize(entry.file.size)}
                                                        </TableCell>
                                                        <TableCell className="w-6">
                                                            {entry.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                                            {entry.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                                            {entry.status === "error" && (
                                                                <span title={entry.errorMessage ?? "Upload failed"}>
                                                                    <XCircle className="w-4 h-4 text-destructive" />
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="w-8">
                                                            {phase === "selection" && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-muted-foreground hover:text-destructive"
                                                                    onClick={() => removeEntry(entry.id)}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        <div className="py-6"><Separator className="bg-primary" /></div>

                        {/* ── Shared metadata ──
                            Mirrors ContentFormFields layout exactly: bg-background Fields,
                            py-wrapped primary Separators between sections, paired rows for
                            owner+persona and type+status. */}
                        <div className="mx-4">

                            <div className="flex flex-row gap-2">
                                {/* Owner */}
                                <Field className="">
                                    <FieldLabel className="text-primary text-lg mb-1">Owner Employee</FieldLabel>
                                    <EmployeePicker
                                        selectedId={meta.ownerID}
                                        disabled={uploading}
                                        onSelect={(id, employee) => {
                                            const updates: Partial<BulkSharedMeta> = { ownerID: id ?? null };
                                            // Auto-fill persona from the selected employee if not already set.
                                            if (employee?.persona && !meta.targetPersona) {
                                                updates.targetPersona = employee.persona;
                                            }
                                            patchMeta(updates);
                                        }}
                                    />
                                </Field>

                                <Separator className="bg-primary mx-2" orientation="vertical" />

                                {/* Target Persona */}
                                <Field className="">
                                    <FieldLabel className="text-primary text-lg mb-1">
                                        Target Persona <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Select
                                        value={meta.targetPersona}
                                        onValueChange={v => patchMeta({ targetPersona: v })}
                                        disabled={uploading}
                                    >
                                        <SelectTrigger className=" h-10! text-sm">
                                            <SelectValue placeholder="Select target persona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="underwriter">Underwriter</SelectItem>
                                            <SelectItem value="businessAnalyst">Business Analyst</SelectItem>
                                            <SelectItem value="actuarialAnalyst">Actuarial Analyst</SelectItem>
                                            <SelectItem value="EXLOperator">EXL Operations</SelectItem>
                                            <SelectItem value="businessOps">Business Ops</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {metaErrors.targetPersona && (
                                        <FieldDescription className="text-destructive">{metaErrors.targetPersona}</FieldDescription>
                                    )}
                                </Field>
                            </div>

                            <div className="py-6"><Separator className="bg-primary" /></div>

                            {/* Expiration Date */}
                            <div className="flex flex-wrap items-end gap-4  py-4">
                                <Field className=" flex-1">
                                    <FieldLabel className="text-primary text-lg" htmlFor="date-expiration">
                                        Expiration Date
                                    </FieldLabel>
                                    <Popover open={openExpiration} onOpenChange={setOpenExpiration}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                id="date-expiration"
                                                className="justify-start font-normal text-sm h-10"
                                                disabled={uploading}
                                            >
                                                {meta.dateExpiration ? meta.dateExpiration.toLocaleDateString() : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={meta.dateExpiration}
                                                defaultMonth={meta.dateExpiration}
                                                captionLayout="dropdown"
                                                onSelect={date => { patchMeta({ dateExpiration: date }); setOpenExpiration(false); }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </Field>
                            </div>

                            <div className="py-6"><Separator className="bg-primary" /></div>

                            {/* Tags */}
                            <Field className="">
                                <FieldLabel className="text-primary text-lg">
                                    Tags
                                    <InfoButton content={"Add custom tags to help organize and search for this file."} size={"w-5 h-5"} />
                                </FieldLabel>
                                <TagInput value={meta.tags} onChange={tags => patchMeta({ tags })} disabled={uploading} />
                            </Field>

                            <div className="py-6"><Separator className="bg-primary" /></div>

                            <div className="flex flex-row gap-2">
                                {/* Document Type */}
                                <Field className="">
                                    <FieldLabel className="text-primary text-lg">
                                        Type of Document <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Select
                                        value={meta.contentType === "none" ? "" : meta.contentType}
                                        onValueChange={v => patchMeta({ contentType: v as ContentFormValues["contentType"] })}
                                        disabled={uploading}
                                    >
                                        <SelectTrigger className=" h-10! text-sm">
                                            <SelectValue placeholder="Select document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reference">Reference Content</SelectItem>
                                            <SelectItem value="workflow">Workflow Content</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {metaErrors.contentType && (
                                        <FieldDescription className="text-destructive">{metaErrors.contentType}</FieldDescription>
                                    )}
                                </Field>

                                <Separator className="bg-primary mx-2" orientation="vertical" />

                                {/* Document Status */}
                                <Field className="">
                                    <FieldLabel className="text-primary text-lg">
                                        Document Status <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Select
                                        value={meta.status === "none" ? "" : meta.status}
                                        onValueChange={v => patchMeta({ status: v as ContentFormValues["status"] })}
                                        disabled={uploading}
                                    >
                                        <SelectTrigger className=" h-10! text-sm">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="inProgress">In Progress</SelectItem>
                                            <SelectItem value="complete">Complete</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {metaErrors.status && (
                                        <FieldDescription className="text-destructive">{metaErrors.status}</FieldDescription>
                                    )}
                                </Field>
                            </div>

                            <div className="py-6"><Separator className="bg-primary" /></div>

                            {/* Add to Collection */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="add-to-collection"
                                        checked={addToCollection}
                                        onCheckedChange={setAddToCollection}
                                        disabled={uploading}
                                    />
                                    <FieldLabel className="text-primary text-lg cursor-pointer" htmlFor="add-to-collection">
                                        Add to Collection
                                    </FieldLabel>
                                </div>

                                {addToCollection && (
                                    <CollectionPicker
                                        selectedId={collectionId}
                                        onSelect={(id) => setCollectionId(id)}
                                        disabled={uploading}
                                        onCreateNew={() => setAddCollectionDialogOpen(true)}
                                        refreshKey={collectionRefreshKey}
                                        inline
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="py-6"><Separator className="bg-primary" /></div>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            {phase === "uploading" && `Uploading ${uploadIndex} of ${entries.length}…`}
                            {phase === "done" && `${entries.filter(e => e.status === "success").length} of ${entries.length} uploaded.`}
                        </div>
                        <div className="flex gap-2">
                            {phase === "selection" && (
                                <Button
                                    className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                    onClick={handleUpload}
                                >
                                    Upload All
                                </Button>
                            )}
                            {phase === "uploading" && (
                                <Button disabled className="gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading…
                                </Button>
                            )}
                            {phase === "done" && (
                                <>
                                    <Button variant="outline" onClick={handleUploadMore}>Upload More</Button>
                                    <Button
                                        className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground rounded-lg px-4 py-1"
                                        onClick={() => navigate("/files")}
                                    >
                                        Go to Content Library
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                </CardContent>
            </Card>

            <AddCollectionDialog
                open={addCollectionDialogOpen}
                onOpenChange={setAddCollectionDialogOpen}
                onCreated={(collection) => {
                    setCollectionId(collection.id);
                    setCollectionRefreshKey(k => k + 1);
                }}
            />
        </>
    );
}

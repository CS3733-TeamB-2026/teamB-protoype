import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import React, { useEffect, useState } from "react";
import {Loader2, Pencil, Trash2, Search, Plus, StickyNote, File, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { EditServiceReqDialog } from "@/features/servicereqs/EditServiceReqDialog.tsx";
import { AddServiceReqDialog } from "@/features/servicereqs/AddServiceReqDialog.tsx";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog.tsx";
import { Users } from "lucide-react";
import { SortableHead } from "@/components/shared/SortableHead.tsx";
import { useSortState, applySortState } from "@/hooks/use-sort-state.ts";
import { useUser } from "@/hooks/use-user.ts";
import { useAuth0 } from "@auth0/auth0-react";
import type { ServiceReq } from "@/lib/types.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import {findMatches, highlightRange} from "@/lib/highlight.tsx";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar.tsx";
import {formatLabel} from "@/lib/utils.ts";
import { ServiceReqDetail } from "@/components/shared/ServiceReqDetail";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { SlidingTabs } from "@/components/shared/SlidingTabs";
import InfoButton from "@/components/layout/InformationAlert.tsx";

type ServiceReqTab = "all" | "mine" | "assigned";

/**
 * Full-page table for browsing, adding, editing, and deleting service requests.
 *
 * Three tabs — All / Mine (created by me) / Assigned (assigned to me) — filter
 * client-side from a single `/api/servicereqs` fetch, so switching tabs is instant
 * with no additional network calls.
 *
 * Clicking a row toggles an inline detail panel showing notes and any linked
 * content item or collection. Edit/Delete buttons call `e.stopPropagation()` so
 * they don't also toggle the expansion.
 *
 * After any mutation (add or edit), `fetchServiceReqs` is called again rather than
 * patching state with the mutation response — this ensures `owner`, `assignee`, and
 * linked relations are always fully populated from the authoritative query.
 *
 * Edit and delete are gated to the owner, the assignee, or any admin.
 */
function ViewServiceReqs() {

    usePageTitle("Manage Service Reqs");

    const [servicereqs, setServiceReqs] = useState<ServiceReq[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editingServiceReq, setEditingServiceReq] = useState<ServiceReq | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ServiceReq | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null); // id of the currently expanded detail row, null = collapsed
    const user = useUser();
    const [sort, toggleSort] = useSortState<"name" | "created" | "deadline" | "type" | "assignee" | "owner">({column: "name", direction: "asc"});
    const [activeTab, setActiveTab] = useState<ServiceReqTab>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const { getAccessTokenSilently } = useAuth0();

    const fetchServiceReqs = React.useCallback(async () => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/servicereqs", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setServiceReqs(data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => { void fetchServiceReqs(); }, [fetchServiceReqs]);

    const currentUserId = user.user?.id;

    // Tab filters first, then search narrows further — two independent passes over the same data.
    const tabServiceReqs = (() => {
        if (activeTab === "mine") return servicereqs.filter((s) => s.ownerId === currentUserId);
        if (activeTab === "assigned") return servicereqs.filter((s) => s.assigneeId === currentUserId);
        return servicereqs;
    })();

    const filteredServiceReqs = tabServiceReqs.filter((s) => {
        const query = searchTerm.toLowerCase().trim().replace(/\s/g, "");
        if (!query) return true;

        const ownerName = `${s.owner.firstName} ${s.owner.lastName}`.toLowerCase();
        const assigneeName = s.assignee ? `${s.assignee.firstName} ${s.assignee.lastName}`.toLowerCase() : "";
        return (
            s.name.toString().toLowerCase().includes(query) ||
            s.type.toLowerCase().includes(query) ||
            ownerName.includes(query) ||
            assigneeName.includes(query)
        );
    });

    const handleDelete = async (servicereq: ServiceReq) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`/api/servicereqs/${servicereq.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: servicereq.id }),
        });
        if (res.ok) {
            setServiceReqs((prev) => prev.filter((s) => s.id !== servicereq.id));
        }
        setDeleteTarget(null);
    };

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <>
            <Hero
                icon={Users}
                title="View Service Requests"
                description="View, update, and delete service requests."
                infoContent="Manage all service requests here. You can view all requests, ones created by you, or ones assigned to you with tabs."
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center px-4">
                <CardHeader>
                        <CardTitle className="text-3xl text-primary mt-4 flex items-center gap-2 justify-center">
                            Service Requests
                            <div className="w-8 h-8 cursor-pointer">
                                <InfoButton content={"Service requests make it easier for you to manage your workflow. " +
                                    "They can be assigned to a specific employee, given either a single piece of content or a collection " +
                                    "along with a note about them, and given a deadline."
                                }/>
                            </div>
                        </CardTitle>
                    <CardDescription>
                        {filteredServiceReqs.length === servicereqs.length
                            ? `${servicereqs.length} service request${servicereqs.length !== 1 ? "s" : ""}`
                            : `${filteredServiceReqs.length} of ${servicereqs.length} service requests`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceReqTab)}>
                        <SlidingTabs activeTab={activeTab} indicatorColor="bg-foreground">
                            <TabsTrigger value="all" className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0">
                                All
                                <span className="ml-2 text-xs opacity-70">{servicereqs.length}</span>
                            </TabsTrigger>
                            <TabsTrigger value="mine" className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0">
                                Mine
                                <span className="ml-2 text-xs opacity-70">{servicereqs.filter((s) => s.ownerId === currentUserId).length}</span>
                            </TabsTrigger>
                            <TabsTrigger value="assigned" className="relative z-10 data-active:bg-transparent data-active:text-foreground hover:text-foreground/80 data-active:hover:text-foreground px-0">
                                Assigned
                                <span className="ml-2 text-xs opacity-70">{servicereqs.filter((s) => s.assigneeId === currentUserId).length}</span>
                            </TabsTrigger>
                        </SlidingTabs>
                    </Tabs>

                    <div className="flex items-center justify-between mb-4 mt-4">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground pointer-events-none"
                            />
                            <Input
                                type="text"
                                placeholder="Search service requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 h-10 text-base pl-10 pr-4 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 bg-background"
                            />
                        </div>
                        <div>
                            {/* Opens AddServiceReqDialog instead of navigating away */}
                            <Button
                                onClick={() => setAddOpen(true)}
                                className="cursor-pointer p-0! gap-0! border-0! group flex duration-300 items-center overflow-hidden ease-in-out rounded-full hover:w-42 hover:bg-accent-dark hover:text-primary-foreground active:brightness-80 transition-all bg-accent text-primary-foreground w-12 h-12 text-lg justify-start"
                            >
                                <span className="flex items-center justify-center min-w-12 h-12">
                                    <Plus className="w-8! h-8! text-primary-foreground" />
                                </span>
                                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Add Request</span>
                            </Button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm">Loading...</p>
                        </div>
                    ) : (
                        <Table className="text-left">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <SortableHead column="name" label="Name" sort={sort} onSort={toggleSort} className="w-full" />
                                    <TableHead className="w-20" />
                                    <SortableHead column="created" label="Created" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="deadline" label="Deadline" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="assignee" label="Assignee" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="owner" label="Owner" sort={sort} onSort={toggleSort} />
                                    <TableHead className="uppercase tracking-wider text-muted-foreground select-none">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applySortState(filteredServiceReqs, sort, (s, col) => {
                                    if (col === "name") return s.name;
                                    if (col === "type") return s.type;
                                    if (col === "created") return s.created;
                                    if (col === "deadline") return s.deadline;
                                    if (col === "assignee") return s.assignee ? `${s.assignee.lastName} ${s.assignee.firstName}` : "";
                                    if (col === "owner") return `${s.owner.lastName} ${s.owner.firstName}`;
                                }).map((servicereq, index) => {
                                    const matches = findMatches(servicereq.name, searchTerm);
                                    const isExpanded = expandedId === servicereq.id;
                                    const canEdit =
                                        servicereq.ownerId === user.user?.id ||
                                        servicereq.assigneeId === user.user?.id ||
                                        user.user?.persona === "admin";
                                    const stripe = index % 2 === 0 ? "bg-muted/10" : "";
                                    return (
                                    <React.Fragment key={servicereq.id}>
                                        <TableRow
                                            className={`cursor-pointer ${stripe}`}
                                            onClick={() => setExpandedId(isExpanded ? null : servicereq.id)}
                                        >
                                            <TableCell className="text-left pr-4">
                                                <p className="text-sm font-medium truncate">
                                                    {highlightRange(servicereq.name, 0, matches)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{formatLabel(servicereq.type)}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    {servicereq.notes && (
                                                        <StickyNote className="w-3.5 h-3.5" />
                                                    )}
                                                    {servicereq.linkedContent && (
                                                        <File className="w-3.5 h-3.5" />
                                                    )}
                                                    {servicereq.linkedCollection && (
                                                        <FolderOpen className="w-3.5 h-3.5" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {new Date(servicereq.created).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {new Date(servicereq.deadline).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {servicereq.assignee ? (
                                                    <EmployeeAvatar employee={servicereq.assignee} size="sm" />
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <EmployeeAvatar employee={servicereq.owner} size="sm" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={!canEdit}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingServiceReq(servicereq);
                                                            setEditOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={!canEdit}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteTarget(servicereq);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow key={`${servicereq.id}-detail`} className={`${stripe} hover:bg-inherit`}>
                                                <TableCell colSpan={7} className="px-6 py-4">
                                                    <ServiceReqDetail servicereq={servicereq} />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                    );})}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                description={deleteTarget ? <span>This will permanently delete <strong>{deleteTarget.name}</strong>.</span> : undefined}
                onConfirm={() => handleDelete(deleteTarget!)}
            />

            {editingServiceReq && (
                <EditServiceReqDialog
                    key={editingServiceReq.id}
                    content={editingServiceReq}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSave={() => void fetchServiceReqs()}
                />
            )}

            {/* Add servicereq dialog — appends new servicereq to the table on success */}
            <AddServiceReqDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSave={() => void fetchServiceReqs()}
            />
        </>
    );
}

export default ViewServiceReqs;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useEffect, useState } from "react";
import {Loader2, Pencil, Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { EditServiceReqDialog } from "@/features/servicereqs/EditServiceReqDialog.tsx";
import { AddServiceReqDialog } from "@/features/servicereqs/AddServiceReqDialog.tsx";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog.tsx";
import { Users } from "lucide-react";
import { SortableHead } from "@/components/shared/SortableHead.tsx";
import { useSortState, applySortState } from "@/hooks/use-sort-state.ts";
import { useUser } from "@/hooks/use-user.ts";
import { findMatches, highlightRange } from "@/lib/highlight.tsx";
import { useAuth0 } from "@auth0/auth0-react";
import type { ServiceReqItem } from "@/lib/types.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";

function ViewServiceReqs() {

    usePageTitle("Manage Service Reqs");

    const [serviceReqs, setServiceReqs] = useState<ServiceReqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editingServiceReq, setEditingServiceReq] = useState<ServiceReqItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ServiceReqItem | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const user = useUser();
    const [sort, toggleSort] = useSortState<"name" | "created" | "deadline" | "type" | "assigneeId" | "ownerId">({column: "type", direction: "asc"});
    const [searchTerm, setSearchTerm] = useState("");
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {

        const fetchServiceReqs = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/servicereqs", {
                    headers: {Authorization: `Bearer ${token}`},
                })
                const data = await res.json();
                setServiceReqs(data);
                setLoading(false);
            } catch {
                setLoading(false);
            }
        }

        fetchServiceReqs();

    }, [getAccessTokenSilently]);

    const filteredServiceReqs = serviceReqs.filter((e) => {
        const query = searchTerm.toLowerCase().trim().replace(/\s/g, "");
        if (!query) return true;

        return (
            e.name.toLowerCase().includes(query) ||
            e.type.toLowerCase().includes(query) ||
            e.ownerId.toString().includes(query) ||
            e.assigneeId.toString().includes(query)
        );
    });

    const handleDelete = async (servicereq: ServiceReqItem) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`/api/servicereqs`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: servicereq.id }),
        });
        if (res.ok) {
            setServiceReqs((prev) => prev.filter((e) => e.id !== servicereq.id));
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
            />

            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center px-4">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary mt-4">All Service Requests</CardTitle>
                    <CardDescription>Total Service Requests: {serviceReqs.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative">
                            <Search
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
                            />
                            <input
                                type="text"
                                placeholder="Search service requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 h-10 text-lg! pl-2! pr-8 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                        </div>
                        <div>
                            {/* Opens AddServiceReqDialog instead of navigating away */}
                            <Button
                                onClick={() => setAddOpen(true)}
                                className="cursor-pointer p-0! gap-0! border-0! group flex duration-300 items-center overflow-hidden ease-in-out rounded-full hover:w-48 hover:bg-accent-dark hover:text-primary-foreground active:brightness-80 transition-all bg-accent text-primary-foreground w-12 h-12 text-lg justify-start"
                            >
                                <span className="flex items-center justify-center min-w-12 h-12">
                                    <Plus className="w-8! h-8! text-primary-foreground" />
                                </span>
                                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Add Employees</span>
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
                                    <SortableHead column="name" label="Name" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="created" label="Created" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="deadline" label="Deadline" sort={sort} onSort={toggleSort} className="w-full" />
                                    <SortableHead column="type" label="Type" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="assigneeId" label="Assignee ID" sort={sort} onSort={toggleSort} />
                                    <SortableHead column="ownerId" label="Owner ID" sort={sort} onSort={toggleSort} />
                                    <TableHead className="uppercase tracking-wider text-muted-foreground select-none">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applySortState(filteredServiceReqs, sort, (e, col) => {
                                    if (col === "name") return e.name;
                                    if (col === "created") return e.created;
                                    if (col === "deadline") return e.deadline;
                                    if (col === "type") return e.type;
                                    if (col === "assigneeId") return e.assigneeId;
                                    if (col === "ownerId") return e.ownerId;
                                }).map((servicereq) => {
                                    const matches = findMatches(servicereq.name, searchTerm);
                                    return (
                                        <TableRow key={servicereq.id}>
                                            <TableCell className="font-medium">{highlightRange(servicereq.name, 0, matches)}</TableCell>
                                            <TableCell className="font-medium">{servicereq.created}</TableCell>
                                            <TableCell className="font-medium">{servicereq.deadline}</TableCell>
                                            <TableCell className="font-medium">{servicereq.type}</TableCell>
                                            <TableCell className="font-medium">{servicereq.assigneeId}</TableCell>
                                            <TableCell className="font-medium">{servicereq.ownerId}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={servicereq.ownerId !== user?.id && servicereq.assigneeId !== user?.id}
                                                        onClick={() => {
                                                            setEditingServiceReq(servicereq);
                                                            setEditOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={servicereq.ownerId !== user?.id && servicereq.assigneeId !== user?.id}
                                                        onClick={() => setDeleteTarget(servicereq)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                description={deleteTarget ? <span>This will permanently delete {deleteTarget.type} <strong>{deleteTarget.name}</strong>.</span> : undefined}
                onConfirm={() => handleDelete(deleteTarget!)}
            />

            {editingServiceReq && (
                <EditServiceReqDialog
                    key={editingServiceReq.id}
                    content={editingServiceReq}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSave={(updated) =>
                        setServiceReqs((prev) =>
                            prev.map((e) => (e.id === updated.id ? updated : e))
                        )
                    }
                />
            )}

            {/* Add service req dialog — appends new service req to the table on success */}
            <AddServiceReqDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSave={(created) => setServiceReqs((prev) => [...prev, created])}
            />
        </>
    );
}

export default ViewServiceReqs;
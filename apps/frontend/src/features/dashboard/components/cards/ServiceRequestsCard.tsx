import { useEffect, useState } from "react";
import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import { useAuth0 } from "@auth0/auth0-react";
import InfoButton from "@/components/layout/InformationAlert.tsx";
import { ServiceRequestCard } from "@/components/shared/ServiceRequestCard.tsx";
import type { ServiceReq } from "@/lib/types.ts";
import { Loader2, FolderOpen } from "lucide-react";
import { useUser } from "@/hooks/use-user.ts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";

function ServiceRequestsCard() {
    const {getAccessTokenSilently} = useAuth0();
    const [requests, setRequests] = useState<ServiceReq[]>([]);
    const [loading, setLoading] = useState(true);
    const user = useUser();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/servicereqs", {
                    headers: {Authorization: `Bearer ${token}`},
                    cache: "no-store",
                });
                if (res.ok) {
                    const data: ServiceReq[] = await res.json();
                    setRequests(data);
                }
            } catch (error) {
                console.error("Failed to fetch assigned service requests", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchRequests();
    }, [getAccessTokenSilently]);

    const currentUserId = user.user?.id;
    const assignedRequests = requests
        .filter((req) => req.assigneeId === currentUserId)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5);

    return (
        <DashboardCard
            size="medium"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold pb-2">Assigned Service Requests</CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows service requests that have been assigned to you."}/>
                </div>

                {loading || !user.user ? (
                    <div className="flex items-center justify-center py-6 gap-3 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin"/>
                        <p className="text-sm">Loading service requests...</p>
                    </div>
                ) : assignedRequests.length > 0 ? (
                    <div className="space-y-2">
                        {assignedRequests.map((req) => (
                            <ServiceRequestCard key={req.id} servicereq={req} compact hideAssignee />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground flex flex-col items-center justify-center">
                        <FolderOpen className="w-10 h-10 mx-auto mb-2"/>
                        <p className="text-sm">No assigned service requests</p>
                    </div>
                )}

                <Link to="/servicereqs" className="w-full">
                    <Button
                        className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all active:brightness-90 shadow-none"
                        variant="outline">
                        <FolderOpen className="w-4 h-4 shrink-0"/>
                        View Service Requests
                    </Button>
                </Link>
            </CardContent>
        </DashboardCard>
    );
}

export default ServiceRequestsCard;
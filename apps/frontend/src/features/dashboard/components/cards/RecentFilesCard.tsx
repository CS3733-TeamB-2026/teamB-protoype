import {CardContent, CardHeader} from "@/components/ui/card.tsx";
import RecentFiles from "@/features/content/listing/RecentFiles.tsx";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {FolderOpen} from "lucide-react";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";

function RecentFilesCard() {
    return (
        <DashboardCard
            size="medium"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">Recent Files: </CardHeader>
            <CardContent>
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows recently added files "}/>
                </div>
                <RecentFiles />
                <Link to="/files" className="w-full">
                    <Button className="mt-5 w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        View Files
                    </Button>
                </Link>
            </CardContent>
        </DashboardCard>
    );
}

export default RecentFilesCard;
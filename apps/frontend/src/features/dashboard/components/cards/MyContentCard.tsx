import {CardContent, CardHeader} from "@/components/ui/card.tsx";
import MyFiles from "@/features/content/listing/MyFiles.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";

function MyContentCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">My Files: </CardHeader>
            <CardContent>
                <MyFiles/>
            </CardContent>
        </DashboardCard>
    );
}

export default MyContentCard;
import {CardContent, CardHeader} from "@/components/ui/card.tsx";
import MyFiles from "@/features/content/listing/MyFiles.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";

function MyContentCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">My Files: </CardHeader>
            <CardContent>
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows content that you own"}/>
                </div>
                <MyFiles/>
            </CardContent>
        </DashboardCard>
    );
}

export default MyContentCard;
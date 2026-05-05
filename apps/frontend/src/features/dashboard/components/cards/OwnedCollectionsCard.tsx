import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import OwnedCollections from "@/features/content/listing/Collections.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";

function FavoritedCollectionsCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">Owned Collections: </CardHeader>
            <CardContent>
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows the collections that you own"}/>
                </div>
                <OwnedCollections />
            </CardContent>
        </DashboardCard>
    );
}

export default FavoritedCollectionsCard;
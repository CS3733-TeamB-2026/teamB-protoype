import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import OwnedCollections from "@/features/content/listing/Collections.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";

function FavoritedCollectionsCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">Owned Collections: </CardHeader>
            <CardContent>
                <OwnedCollections />
            </CardContent>
        </DashboardCard>
    );
}

export default FavoritedCollectionsCard;
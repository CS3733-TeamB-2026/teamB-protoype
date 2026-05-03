import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import Collections from "@/features/content/listing/Collections.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";

function FavoritedCollectionsCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">Favorited Collections: </CardHeader>
            <CardContent>
                <Collections />
            </CardContent>
        </DashboardCard>
    );
}

export default FavoritedCollectionsCard;
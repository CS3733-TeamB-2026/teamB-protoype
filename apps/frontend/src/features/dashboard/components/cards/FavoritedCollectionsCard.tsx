import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import FavoriteCollections from "@/features/content/listing/FavoriteCollections.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";

function FavoritedCollectionsCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">Favorited Collections: </CardHeader>
            <CardContent>
                <FavoriteCollections />
            </CardContent>
        </DashboardCard>
    );
}

export default FavoritedCollectionsCard;
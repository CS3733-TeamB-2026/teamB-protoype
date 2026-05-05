import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import FavoriteCollections from "@/features/content/listing/FavoriteCollections.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";

function FavoritedCollectionsCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">Favorited Collections: </CardHeader>
            <CardContent>
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows your favorited collections"}/>
                </div>
                <FavoriteCollections />
            </CardContent>
        </DashboardCard>
    );
}

export default FavoritedCollectionsCard;
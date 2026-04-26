import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import BookmarkedFiles from "@/features/content/listing/BookmarkedFiles.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";

function BookmarkedCard() {
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">Favorites: </CardHeader>
            <CardContent>
                <BookmarkedFiles />
            </CardContent>
        </DashboardCard>
    );
}

export default BookmarkedCard;
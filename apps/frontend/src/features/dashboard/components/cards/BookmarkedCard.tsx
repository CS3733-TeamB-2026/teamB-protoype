import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import BookmarkedFiles from "@/features/content/listing/BookmarkedFiles.tsx";

function BookmarkedCard() {
    return (
        <Card className="shadow-lg hover:scale-101 transition-transform md:col-span-2 px-4 py-8">
            <CardHeader className="text-left text-2xl! font-semibold">Favorites: </CardHeader>
            <CardContent>
                <BookmarkedFiles />
            </CardContent>
        </Card>
    );
}

export default BookmarkedCard;
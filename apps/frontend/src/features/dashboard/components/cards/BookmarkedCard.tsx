import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import BookmarkedFiles from "@/features/content/listing/BookmarkedFiles.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";
import InfoButton from "@/components/layout/InformationAlert.tsx";

function BookmarkedCard() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">{ts('content.favorites')}: </CardHeader>
            <CardContent>
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows content that you have favorited"}/>
                </div>
                <BookmarkedFiles />
            </CardContent>
        </DashboardCard>
    );
}

export default BookmarkedCard;
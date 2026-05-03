import {CardContent, CardHeader} from "@/components/ui/card.tsx";
import MyFiles from "@/features/content/listing/MyFiles.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

function MyContentCard() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">{ts('dashCard.myFiles')}</CardHeader>
            <CardContent>
                <MyFiles/>
            </CardContent>
        </DashboardCard>
    );
}

export default MyContentCard;
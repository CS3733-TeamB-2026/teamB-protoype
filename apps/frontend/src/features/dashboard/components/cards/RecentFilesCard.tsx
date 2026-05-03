import {CardContent, CardHeader} from "@/components/ui/card.tsx";
import RecentFiles from "@/features/content/listing/RecentFiles.tsx";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {FolderOpen} from "lucide-react";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

function RecentFilesCard() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    return (
        <DashboardCard
            size="medium"
            borderColor="secondary"
        >
            <CardHeader className="text-left text-2xl! font-semibold">{ts('dashCard.RecentFiles')}</CardHeader>
            <CardContent>
                <RecentFiles />
                <Link to="/files" className="w-full">
                    <Button className="mt-5 w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        {ts('dashCard.ViewFiles')}
                    </Button>
                </Link>
            </CardContent>
        </DashboardCard>
    );
}

export default RecentFilesCard;
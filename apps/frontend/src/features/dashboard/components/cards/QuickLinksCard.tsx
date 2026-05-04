import {CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {CalendarClock, FolderOpen, Plus, UserPlus, Users} from "lucide-react";
import { useUser } from "@/hooks/use-user.ts"
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

function QuickLinksCard() {

    const {user} = useUser();
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader>
                <CardTitle className="capitalize text-2xl font-semibold text-center">
                    User Access: {user?.persona}
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground">{ts('dashCard.QuickLinks')}</p>
            </CardHeader>
            <CardContent>
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows quick access links based on your persona"}/>
                </div>
                <div className="flex flex-col gap-3 px-2">
                    {user?.persona === "admin" ?
                        <Link to="/usermanagement" className="w-full">
                            <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                <Users className="w-4 h-4 shrink-0" />
                                {ts('sidebar.viewEmployees')}
                            </Button>
                        </Link>
                        :
                        null
                    }
                    {user?.persona === "admin" ?
                        <Link to="/employeeform" className="w-full">
                            <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                <UserPlus className="w-4 h-4 shrink-0" />
                                {ts('sidebar.addEmployees')}
                            </Button>
                        </Link>
                        :
                        null
                    }
                    <Link to="/files" className="w-full">
                        <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                            <FolderOpen className="w-4 h-4 shrink-0" />
                            {ts('dashCard.ViewFiles')}
                        </Button>
                    </Link>
                    <Link to="/calendar" className="w-full">
                        <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                            <CalendarClock className="w-4 h-4 shrink-0" />
                            {ts('dashCard.ViewCalendar')}
                        </Button>
                    </Link>
                    <Link to="/files/bulk" className="w-full">
                        <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                            <Plus className="w-4 h-4 shrink-0" />
                            {ts('sidebar.addContent')}
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </DashboardCard>
    );
}

export default QuickLinksCard;
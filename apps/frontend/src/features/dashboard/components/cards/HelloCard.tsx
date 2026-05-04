import {CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {LayoutDashboard} from "lucide-react";
import { useUser } from "@/hooks/use-user.ts";
import { useAvatarUrl } from "@/hooks/use-avatar-url";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

function HelloCard() {

    const {user} = useUser();
    const avatarUrl = useAvatarUrl(user?.id, user?.profilePhotoURI);
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    return (
        <DashboardCard
            size="medium"
            borderColor="primary"
        >
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex flex-row gap-5 items-center">
                        <Avatar className="w-15 h-15 ">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="bg-accent text-primary-foreground">{user?.firstName[0]}{user?.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-3xl text-left">{ts('dashCard.WelcomeBack')} {user?.firstName} {user?.lastName}.</CardTitle>
                            <CardDescription className="text-lg text-left">{ts('dashCard.LetsPickUp')}</CardDescription>
                        </div>
                    </div>
                    <LayoutDashboard className="w-15! h-15!"/>
                </div>

            </CardHeader>
        </DashboardCard>
        );
}

export default HelloCard;
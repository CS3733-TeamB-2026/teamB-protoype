import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {LayoutDashboard} from "lucide-react";
import { useUser } from "@/hooks/use-user.ts";

function HelloCard() {

    const user = useUser();

    return (
        <Card className="md:col-span-2 py-8 px-4 shadow-lg hover:scale-101 transition-transform">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex flex-row gap-5 items-center">
                        <Avatar className="w-15 h-15 ">
                            {
                                user?.profilePhotoURI?
                                    <AvatarImage src={user?.profilePhotoURI} />
                                    :
                                    <AvatarFallback className="bg-accent text-primary-foreground">{" " + user?.firstName[0] + user?.lastName[0]}</AvatarFallback>
                            }
                        </Avatar>
                        <div>
                            <CardTitle className="text-3xl text-left">Welcome back, {user?.firstName} {user?.lastName}.</CardTitle>
                            <CardDescription className="text-lg text-left">Let's pick up where you left off.</CardDescription>
                        </div>
                    </div>
                    <LayoutDashboard className="w-15! h-15!"/>
                </div>

            </CardHeader>
        </Card>
        );
}

export default HelloCard;
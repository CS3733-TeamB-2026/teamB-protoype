import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card.tsx"
import {useEffect, useState} from "react";
import { useUser } from "@/hooks/use-user.ts";
import {Link} from "react-router-dom";
import RecentFiles from "@/components/RecentFiles.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Hero} from "@/components/shared/Hero.tsx";
import {LayoutDashboard, User, Clock, Users, UserPlus, FolderOpen, Plus} from "lucide-react"
import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";
import BookmarkedFiles from "@/components/shared/BookmarkedFiles.tsx";

function EmployeeHome() {
    const user = useUser();

    const [currentDateTime, setCurrentDateTime] = useState({
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        time: new Date().toLocaleTimeString()
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentDateTime({
                day: now.toLocaleDateString('en-US', { weekday: 'long' }),
                time: now.toLocaleTimeString()
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/*Main Page*/}
            <Hero
                icon={LayoutDashboard}
                description="Find all your tools here."
                title="Dashboard"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 mx-20">
                {/* Hello Card */}
                <Card className="md:col-span-2 py-8 px-4 shadow-lg hover:scale-101 transition-transform">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-row gap-5 items-center">
                                <Avatar className="w-15 h-15 ">
                                    <AvatarFallback className="bg-accent text-primary-foreground text-lg">{user ? user.firstName[0] + user.lastName[0] : <User />}</AvatarFallback>
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

                {/* Clock Card */}
                <Card className="shadow-lg hover:scale-101 transition-transform px-4 py-4 flex flex-row justify-center items-center">
                    <CardContent className="p-0">
                        <div className="flex flex-row items-center gap-5 justify-center">
                            <Clock className="w-15! h-15!"/>
                            <p className="text-lg font-semibold">It is {currentDateTime.time} on {currentDateTime.day}.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Expiring Soon */}
                <Card className="shadow-lg hover:scale-101 transition-transform md:col-span-1 px-4 py-8">
                    <CardHeader className="text-left text-2xl! font-semibold">Bookmarked: </CardHeader>
                    <CardContent>
                        <BookmarkedFiles />
                    </CardContent>
                </Card>

                {/* My Content Card */}
                <Card className="shadow-lg hover:scale-101 transition-transform md:col-span- px-4 py-8">
                    <CardHeader className="text-left text-2xl! font-semibold">My Files: </CardHeader>
                    <CardContent>
                        <RecentFiles />
                        <p>Temporary</p>
                    </CardContent>
                </Card>

                {/* Quick Links Card */}
                <Card className="shadow-lg hover:scale-101 transition-transform">
                    <CardHeader>
                        <CardTitle className="capitalize text-2xl font-semibold text-center">
                            User Access: {user?.persona}
                        </CardTitle>
                        <p className="text-center text-sm text-muted-foreground">Quick Links</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 px-2">
                            {user?.persona === "admin" ?
                                <Link to="/usermanagement" className="w-full">
                                    <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                        <Users className="w-4 h-4 shrink-0" />
                                        View Users
                                    </Button>
                                </Link>
                                :
                                null
                            }
                            {user?.persona === "admin" ?
                                <Link to="/employeeform" className="w-full">
                                    <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                        <UserPlus className="w-4 h-4 shrink-0" />
                                        Add Employee
                                    </Button>
                                </Link>
                                :
                                null
                            }
                            <Link to="/files" className="w-full">
                                <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                    <FolderOpen className="w-4 h-4 shrink-0" />
                                    View Files
                                </Button>
                            </Link>
                            <Link to="/manageform" className="w-full">
                                <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                    <Plus className="w-4 h-4 shrink-0" />
                                    Add Content
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Files Card */}
                <Card className="shadow-lg hover:scale-101 transition-transform md:col-span-3 px-4 py-8">
                    <CardHeader className="text-left text-2xl! font-semibold">Recent Files: </CardHeader>
                    <CardContent>
                        <RecentFiles />
                        <Link to="/files" className="w-full">
                            <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                <FolderOpen className="w-4 h-4 shrink-0" />
                                View Files
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

        </>
    )
}

export default EmployeeHome;
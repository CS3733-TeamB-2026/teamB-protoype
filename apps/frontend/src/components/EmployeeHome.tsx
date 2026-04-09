import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card"
import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import RecentFiles from "@/components/RecentFiles.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Hero} from "@/components/shared/Hero.tsx";
import {LayoutDashboard, User, Clock} from "lucide-react"
import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";

function EmployeeHome() {
    const [user] = React.useState(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    })

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 mx-20 my-5">

                {/* Hello Card */}
                <Card className="md:col-span-2 py-8 px-4 shadow-lg hover:scale-101 transition-transform">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-row gap-5 items-center">
                                <Avatar className="w-15 h-15 ">
                                    <AvatarFallback className="bg-primary text-primary-foreground">{user ? user.firstName[0] + user.lastName[0] : <User />}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-3xl text-left">Welcome back, {user.firstName} {user.lastName}.</CardTitle>
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

                {/* Quick Links Card */}
                <Card className="shadow-lg hover:scale-101 transition-transform">
                    <CardHeader>
                        <CardTitle className="capitalize text-2xl mb-4 font-semibold px-4 py-3 text-center">User Access: {user.persona}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center mb-4 text-xl">Quick Links:</p>
                        <div className="flex flex-col items-center gap-2 gap-y-5 justify-center h-full">
                            { user.persona === "admin" ?
                                <Link to="/usermanagement">
                                    <Button className="shadow-xl text-xl px-6 py-5 bg-primary text-background hover:bg-secondary hover:text-secondary-foreground" variant="outline">
                                        View Users
                                    </Button>
                                </Link>
                                :
                                null
                            }
                            { user.persona === "admin" ?
                                <Link to="/employeeform">
                                    <Button className="shadow-xl text-xl px-6 py-5 bg-primary text-background hover:bg-secondary hover:text-secondary-foreground" variant="outline">
                                        Add Employee Form
                                    </Button>
                                </Link>
                                :
                                null
                            }
                            <Link to="/files">
                                <Button className="shadow-xl text-xl px-6 py-5 bg-primary text-background hover:bg-secondary hover:text-secondary-foreground" variant="outline">
                                    View Files
                                </Button>
                            </Link>
                            <Link to="/manageform">
                                <Button className="shadow-xl text-xl px-6 py-5 bg-primary text-background hover:bg-secondary hover:text-secondary-foreground" variant="outline">
                                    Manage Content Form
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Files Card */}
                <Card className="shadow-lg hover:scale-101 transition-transform md:col-span-2 px-4 py-8">
                    <CardHeader className="text-left text-2xl! font-semibold">Recent Files: </CardHeader>
                    <CardContent>
                        <RecentFiles />
                        <Link to="/files">
                            <Button className="my-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-40 mx-auto rounded-lg px-2 py-5 text-base">View All Content</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

        </>
    )
}

export default EmployeeHome;
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
                icon="home"
                title="Dashboard"
            />
            <Card className="shadow-lg max-w-5xl mx-auto mt-8 mb-8 text-center p-10">
                <CardHeader>
                    <div className="flex justify-between items-baseline">
                        <CardTitle className="text-xl text-left">Welcome back, {user.firstName} {user.lastName}.</CardTitle>
                        <CardDescription className="text-left text-black font-bold"> It is {currentDateTime.time} on {currentDateTime.day}.</CardDescription>
                    </div>
                    <CardDescription className="text-left">Let's pick up where you left off.</CardDescription>
                </CardHeader>
                {/*past the intro, main files and links, description*/}
                <CardContent className="">
                    {/*recent file and quick links*/}
                    <div className="columns-2">
                        <div>
                            <Card>
                                <CardHeader className="text-left text-lg">Recent Files: </CardHeader>
                                <CardContent>
                                    <RecentFiles />
                                    <Link to="/files">
                                        <Button className="my-5 hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-40 mx-auto rounded-lg px-2 py-5 text-base">View All Content</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="text-right">
                            <Card>
                                <CardHeader className="text-lg">Quick Links: </CardHeader>
                                <CardContent>
                                    {/*recent links go here*/}
                                    <Link to="/usermanagement">
                                        <Button className="bg-primary text-background hover:bg-black hover:text-background" variant="outline" size="lg">
                                            View Users
                                        </Button>
                                    </Link>
                                    <Link to="/files">
                                        <Button className="bg-primary text-background hover:bg-black hover:text-background" variant="outline" size="lg">
                                            View Files
                                        </Button>
                                    </Link>
                                    <Link to="/manageform">
                                        <Button className="bg-primary text-background hover:bg-black hover:text-background" variant="outline" size="lg">
                                            Manage Content Form
                                        </Button>
                                    </Link>
                                    <Link to="/employeeform">
                                        <Button className="bg-primary text-background hover:bg-black hover:text-background" variant="outline" size="lg">
                                            Add Employee Form
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

export default EmployeeHome;
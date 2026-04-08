import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card"
import React from "react";
import {Link} from "react-router-dom";

function Home() {
    const [user] = React.useState(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    })
        return (
        <>
            {/*Main Page*/}
            <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center p-10">
                <CardHeader>
                    <CardTitle className="text-xl text-left">Welcome back, {user.firstName} {user.lastName}</CardTitle>
                    <CardDescription className="text-left">Let's pick up where you left off.</CardDescription>
                </CardHeader>
                {/*past the intro, main files and links, description*/}
                <CardContent className="">
                    {/*recent file and quick links*/}
                    <div className="columns-2">
                        <div>
                            <Card>
                                <CardHeader className="text-left text-lg">Recent Files: </CardHeader>
                                <CardContent className="text-left">
                                    {/*recent file objects go here!*/}
                                    <a href="" className="text-blue-500">Example File Link</a>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="text-right">
                            <Card>
                                <CardHeader className="text-lg">Quick Links: </CardHeader>
                                <CardContent>
                                    {/*recent links go here*/}
                                    <Link to="/manageform">
                                        <p className="text-blue-500">Content Management Form</p>
                                    </Link>
                                    <Link to="/employeeform">
                                        <p className="text-blue-500">Employee Management Form</p>
                                    </Link>
                                    <Link to="/">
                                        <p className="text-blue-500">Dummy Link</p>
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

export default Home;
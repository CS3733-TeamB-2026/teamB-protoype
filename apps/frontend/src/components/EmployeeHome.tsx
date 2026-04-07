import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card"

function Home() {
        return (
        <>
            {/*Main Page*/}
            <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center p-10">
                <CardHeader>
                    <CardTitle className="text-xl text-left">Welcome back, *Employee Name* !</CardTitle>
                    <CardDescription className="text-left">Let's pick up where you left off.</CardDescription>
                </CardHeader>
                {/*past the intro, main files and links, description*/}
                <CardContent className="m-2">
                    {/*recent file and quick links*/}
                    <div className="columns-2">
                        <div>
                            <Card>
                                <CardHeader className="text-left">Recent Files: </CardHeader>
                                <CardContent className="text-left">
                                    {/*recent file objects go here!*/}
                                    <a href="" className="text-blue-500">Example File Link</a>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="text-right">
                            <Card>
                                <CardHeader>Quick Links</CardHeader>
                                <CardContent>
                                    {/*recent file objects go here!*/}
                                    <a href="" className="text-blue-500">Example Management Link</a>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <p className="text-left mt-5 text-lg">Additional: </p>
                </CardContent>
            </Card>
        </>
    )
}

export default Home;
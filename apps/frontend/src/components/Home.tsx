import { Button } from "@/components/ui/button"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card"
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"

function Home() {
    return (
        <>
            {/*Hero*/}
            <div className="flex flex-col items-center justify-center py-20 px-8 bg-secondary-foreground text-primary-foreground">
                <h1 className="text-4xl font-bold mb-4">Hanover Insurance - Content Management Service</h1>
                <p className="text-lg mb-8 text-primary-foreground/80">CS3733 Team B D26</p>
                <Button variant="secondary" size="lg">Get Started</Button>
            </div>

            {/*Main Paragraph*/}
            <Card className="shadow-lg max-w-5xl mx-auto mt-8 text-center">
                <CardHeader>
                    <CardTitle className="text-xl">Welcome to Our App.</CardTitle>
                    <CardDescription>One place to manage your files.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.
                        Cras mattis consectetur purus sit amet fermentum. Donec sed odio dui. Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel eu leo. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Etiam porta sem malesuada magna mollis euismod. Cras justo odio, dapibus ut facilisis et, egestas nunc sed. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Sed posuere consectetur est at lobortis.
                    </p>
                </CardContent>
            </Card>

            {/*Team Avatars*/}
            <section className="mt-12 max-w-4xl mx-auto mb-12">
                <h1 className="text-2xl font-bold text-primary text-center mb-8">Meet Our Team</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <Card className="shadow-lg text-center p-6">
                        <CardContent className="flex flex-col items-center justify-center gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarFallback className="text-xl bg-primary text-primary-foreground">DZ</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold text-lg">Dylan Zickus</h2>
                                <p className="text-muted-foreground">Development Lead</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg text-center p-6">
                        <CardContent className="flex flex-col items-center justify-center gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarFallback className="text-xl bg-primary text-primary-foreground">OS</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold text-lg">Oscar Stomberg</h2>
                                <p className="text-muted-foreground">Assistant Lead</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg text-center p-6">
                        <CardContent className="flex flex-col items-center justify-center gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarFallback className="text-xl bg-primary text-primary-foreground">HS</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold text-lg">Hayden Schultz</h2>
                                <p className="text-muted-foreground">FT Engineer & Scrum Master</p>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </section>

        </>
    )
}

export default Home;
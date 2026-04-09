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
    AvatarImage,
} from "@/components/ui/avatar"
import { teamPhotos } from "@/components/ui/team-photos";
import { Hero } from "@/components/shared/Hero.tsx";
import { Home as HomeIcon } from "lucide-react";

function Home() {
    type ImageKey = keyof typeof teamPhotos;
    type TeamMember = {
        name: string;
        initials: string;
        role: string;
        photo: ImageKey;
    }

    const members: TeamMember[] = [
        { name: "Dylan Zickus", initials: "DZ", role: "Lead Software Engineer", photo: "dylan" },
        { name: "Oscar Stomberg", initials: "OS", role: "Assistant Lead Software Engineer", photo: "oscar" },
        { name: "Jake Swanson", initials: "JS", role: "Assistant Lead Software Engineer", photo: "jake" },
        { name: "Luke Ciarletta", initials: "LC", role: "Full Time Software Engineer", photo: "luke" },
        { name: "Nick Houghton", initials: "NH", role: "Full Time Software Engineer", photo: "nicholas" },
        { name: "Cameron Pietraski", initials: "CP", role: "Full Time Software Engineer", photo: "cameron" },
        { name: "Hayden Schultz", initials: "HS", role: "FT Software Engineer & Scrum Master", photo: "hayden" },
        { name: "Philip Ostrowski", initials: "PO", role: "PT Software Engineer & Project Manager", photo: "philip" },
        { name: "Joseph Hemmerle", initials: "JH", role: "PT Software Engineer & Project Owner", photo: "joey" },
        { name: "Ricardo Guzman Volpe", initials: "RG", role: "PT Software Engineer & Documentation Analyst", photo: "ricardo" }
    ]

    return (
        <>
            <Hero
                icon={HomeIcon}
                title="Hanover Insurance - Content Management Application"
                description="CS3733 Team B D26"
            />

            {/*Main Paragraph*/}
            <Card id="content" className="scroll-mt-25 shadow-lg max-w-5xl mx-auto mt-8 text-center">
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

                    <br />

                </CardContent>
            </Card>

            {/*Team Avatars*/}
            <section className="mt-12 max-w-7xl mx-auto mb-12">
                <h1 className="text-2xl font-bold text-primary text-center mb-8" >Meet Our Team</h1>
                <div className="flex flex-wrap md:grid-cols-5 gap-6 justify-center">

                    {members.map((member: TeamMember) => (
                        <Card className="shadow-lg text-center p-6 w-60 hover:scale-105 ease-linear duration-100" key={member.name}>
                            <CardContent className="flex flex-col items-center justify-center gap-4">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage
                                        src={teamPhotos[member.photo]}
                                        alt={member.name}
                                    />
                                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                                        {member.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold text-lg">{member.name}</h2>
                                    <p className="text-muted-foreground">{member.role}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                </div>
            </section>

        </>
    )
}

export default Home;
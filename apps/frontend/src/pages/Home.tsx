import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card.tsx"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar.tsx"
import { teamPhotos } from "@/components/ui/team-photos.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { Home as HomeIcon, LucideFolder, User, GraduationCap } from "lucide-react";

function Home() {

    //team member data
    type ImageKey = keyof typeof teamPhotos;
    type TeamMember = {
        name: string;
        initials: string;
        role: string;
        photo: ImageKey;
    }

    //members list, for displaying cards
    const members: TeamMember[] = [
        { name: "Dylan Zickus", initials: "DZ", role: "Lead Software Engineer", photo: "dylan" },
        { name: "Oscar Stomberg", initials: "OS", role: "Assistant Lead Software Engineer", photo: "oscar" },
        { name: "Jake Swanson", initials: "JS", role: "Assistant Lead Software Engineer", photo: "jake" },
        { name: "Hayden Schultz", initials: "HS", role: "Assistant Lead Software Engineer & Scrum Master", photo: "hayden" },
        { name: "Luke Ciarletta", initials: "LC", role: "Full Time Software Engineer", photo: "luke" },
        { name: "Nick Houghton", initials: "NH", role: "Full Time Software Engineer", photo: "nicholas" },
        { name: "Cameron Pietraski", initials: "CP", role: "Full Time Software Engineer", photo: "cameron" },
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
            <Card id="content" className="scroll-mt-25 shadow-lg max-w-5xl mx-auto mt-8 text-center py-8">
                <CardHeader>
                    <CardTitle className="text-4xl text-primary">Welcome to iBank.</CardTitle>
                    <CardDescription className="text-lg">One place to manage your files.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 w-fit mx-auto">
                        <div className="flex flex-col items-center justify-center gap-4 w-90 py-8 px-6 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                            <div className="p-4 rounded-full bg-primary/10">
                                <User className="w-8 h-8 text-primary"/>
                            </div>
                            <h1 className="text-xl font-semibold text-primary">Log in to begin.</h1>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-4 w-90 py-8 px-6 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                            <div className="p-4 rounded-full bg-primary/10">
                                <LucideFolder className="w-8 h-8 text-primary"/>
                            </div>
                            <h1 className="text-xl font-semibold text-primary">Manage all your files.</h1>
                        </div>
                        <div className="col-span-2 flex flex-col items-center justify-center gap-4 py-8 px-6 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                            <div className="p-4 rounded-full bg-primary/10">
                                <GraduationCap className="w-8 h-8 text-primary"/>
                            </div>
                            <h1 className="text-xl font-semibold text-primary">Made by WPI Students.</h1>
                        </div>

                    </div>
                    <p className="text-md mt-4">Disclaimer: This website has been created for WPI’s CS 3733 Software Engineering as a class project and is not in use by Hanover Insurance.</p>
                    <p className="text-md mt-4">Created by Team B, D26.</p>

                    <br />

                </CardContent>
            </Card>

            {/*team member cards*/}
            <section className="mt-12 max-w-7xl mx-auto mb-12">
                <h1 className="text-2xl font-bold text-primary text-center mb-8" >Meet The Team</h1>
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
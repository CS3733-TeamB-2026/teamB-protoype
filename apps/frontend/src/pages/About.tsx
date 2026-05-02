import {HelpCircle, Users} from "lucide-react";
import {Hero} from "@/components/shared/Hero.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {teamPhotos} from "@/components/ui/team-photos.tsx";
import { BookOpen, UserCheck, Building2, Briefcase, Heart } from "lucide-react";
import {usePageTitle} from "@/hooks/use-page-title.ts";


function About() {

    usePageTitle("About");

    type ImageKey = keyof typeof teamPhotos;
    type TeamMember = {
        name: string;
        initials: string;
        role: string;
        photo: ImageKey;
    }

    const members: TeamMember[] = [
        { name: "Dylan Zickus", initials: "DZ", role: 'Lead Software Engineer', photo: "dylan" },
        { name: "Oscar Stomberg", initials: "OS", role: 'Assistant Lead Software Engineer', photo: "oscar" },
        { name: "Jake Swanson", initials: "JS", role: 'Assistant Lead Software Engineer', photo: "jake" },
        { name: "Hayden Schultz", initials: "HS", role: 'Assistant Lead Software Engineer & Scrum Master', photo: "hayden" },
        { name: "Luke Ciarletta", initials: "LC", role: 'Full-Time Software Engineer', photo: "luke" },
        { name: "Nick Houghton", initials: "NH", role: 'Full-Time Software Engineer', photo: "nicholas" },
        { name: "Cameron Pietraski", initials: "CP", role: 'Full-Time Software Engineer', photo: "cameron" },
        { name: "Philip Ostrowski", initials: "PO", role: 'Part-Time Software Engineer & Project Manager', photo: "philip" },
        { name: "Joseph Hemmerle", initials: "JH", role: 'Part-Time Software Engineer & Product Owner', photo: "joey" },
        { name: "Ricardo Guzman Volpe", initials: "RG", role: 'Part-Time Software Engineer & Documentation Analyst', photo: "ricardo" }
    ]

    return (
        <>
            <Hero
                icon={HelpCircle}
                title="About"
                description="About this application."
            />

            <div className="container mx-auto">
                <Card className="mx-auto max-w-5xl mt-10 mb-8 border-t-4 border-t-primary shadow-lg">
                    <CardContent className="p-8">
                        <div className="mb-6">
                            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                Developed for
                            </p>
                            <h2 className="text-2xl font-bold text-primary">
                                WPI Computer Science Department
                            </h2>
                            <p className="text-lg text-muted-foreground mt-1">
                                CS3733-D26 · Software Engineering
                            </p>
                        </div>

                        <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Professor</p>
                                    <p className="font-semibold">Prof. Wilson Wong</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                                    <UserCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Team Coach</p>
                                    <p className="font-semibold">Artem Frenk</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="relative max-w-5xl mx-auto px-6 mb-8">
                    <div className="absolute inset-0 flex items-center px-6">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                        <div className="flex items-center gap-2 bg-card px-4 py-1.5 rounded-full border border-border shadow-sm">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">Meet The Team</span>
                        </div>
                    </div>
                </div>

                <section className="max-w-5xl mx-auto mb-12">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
                        {members.map((member: TeamMember) => (
                            <Card
                                className={`w-full max-w-55 shadow-sm border-t-primary border-t-4 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-150`}
                                key={member.name}
                            >
                                <CardContent className="flex flex-col items-center justify-center gap-3 pt-6 pb-6 px-3">
                                    <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                                        <AvatarImage
                                            src={teamPhotos[member.photo]}
                                            alt={member.name}
                                        />
                                        <AvatarFallback className="text-base bg-primary text-primary-foreground">
                                            {member.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="font-semibold text-sm leading-tight">{member.name}</h2>
                                        <p className="text-muted-foreground text-xs mt-1 leading-snug">{member.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <div className="relative max-w-5xl mx-auto px-6 mb-8">
                    <div className="absolute inset-0 flex items-center px-6">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                        <div className="flex items-center gap-2 bg-card px-4 py-1.5 rounded-full border border-border shadow-sm">
                            <Heart className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">Thank You!</span>
                        </div>
                    </div>
                </div>

                <Card className="shadow-lg mx-auto max-w-5xl my-8 overflow-hidden border-t-4 border-t-primary">
                    <div className="bg-primary/5 px-8 py-4 border-b flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary fill-primary" />
                        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                            With gratitude to our project partner
                        </p>
                    </div>

                    <CardContent className="p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                                <Building2 className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-primary">
                                    The Hanover Insurance Group
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    For their partnership and this incredible opportunity.
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">Brandon Roche</p>
                                    <p className="text-sm text-muted-foreground">Deputy CIO</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">Meaghan Jenket</p>
                                    <p className="text-sm text-muted-foreground">Principal Business Architect</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

export default About;
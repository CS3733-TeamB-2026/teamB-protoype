import {
    Card,
    CardContent
} from "@/components/ui/card.tsx"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar.tsx"
import { teamPhotos } from "@/components/ui/team-photos.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import { Home as HomeIcon, LucideFolder, User, GraduationCap, ShieldCheck, BookOpen, Users } from "lucide-react";
import { useLocale } from "@/languageSupport/localeContext";
import { useTranslation } from "@/languageSupport/useTranslation";
import type { TranslationKey } from "@/languageSupport/keys.ts";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { useAuth0 } from "@auth0/auth0-react";

function Home() {

    usePageTitle("Home");

    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    const { loginWithRedirect } = useAuth0();

    type ImageKey = keyof typeof teamPhotos;
    type TeamMember = {
        name: string;
        initials: string;
        role: TranslationKey;
        photo: ImageKey;
    }

    const members: TeamMember[] = [
        { name: "Dylan Zickus", initials: "DZ", role: 'role.lead', photo: "dylan" },
        { name: "Oscar Stomberg", initials: "OS", role: 'role.assistantLead', photo: "oscar" },
        { name: "Jake Swanson", initials: "JS", role: 'role.assistantLead', photo: "jake" },
        { name: "Hayden Schultz", initials: "HS", role: 'role.assistantLeadAndScrumMaster', photo: "hayden" },
        { name: "Luke Ciarletta", initials: "LC", role: 'role.fullTime', photo: "luke" },
        { name: "Nick Houghton", initials: "NH", role: 'role.fullTime', photo: "nicholas" },
        { name: "Cameron Pietraski", initials: "CP", role: 'role.fullTime', photo: "cameron" },
        { name: "Philip Ostrowski", initials: "PO", role: 'role.ptManager', photo: "philip" },
        { name: "Joseph Hemmerle", initials: "JH", role: 'role.ptOwner', photo: "joey" },
        { name: "Ricardo Guzman Volpe", initials: "RG", role: 'role.ptAnalyst', photo: "ricardo" }
    ]

    return (
        <>
            <Hero
                icon={HomeIcon}
                title={ts('home.header')}
                description={ts('home.subheader')}
            />


            {/* Stats strip */}
            <div className="bg-primary text-primary-foreground shadow-md">
                <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 divide-x divide-primary-foreground/20">

                    <div className="flex flex-col items-center gap-0.5 px-4">
                        <span className="text-3xl font-bold">{members.length}</span>
                        <span className="text-xs text-primary-foreground/70 uppercase tracking-widest">
                Team Members
            </span>
                    </div>

                    <div className="flex flex-col items-center gap-0.5 px-4">
                        <span className="text-3xl font-bold">6</span>
                        <span className="text-xs text-primary-foreground/70 uppercase tracking-widest">
                Personas
            </span>
                    </div>

                </div>
            </div>

            {/* Welcome section */}
            <div id="content" className="scroll-mt-20 max-w-6xl mx-auto px-6 mt-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-primary">{ts('home.mainHeader')}</h1>
                    <p className="text-lg text-muted-foreground mt-2 max-w-xl mx-auto">{ts('home.subheader')}</p>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    <Card
                        onClick={() => loginWithRedirect({
                            appState: { returnTo: '/employeehome' }
                        })}
                          className="cursor-pointer shadow-md border-t-4 border-t-primary hover:shadow-lg transition-shadow"
                    >
                        <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                            <div className="p-4 rounded-full bg-primary/10">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{ts("home.bubble1")}</h3>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow">
                        <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                            <div className="p-4 rounded-full bg-accent/10">
                                <LucideFolder className="w-8 h-8 text-accent" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{ts("home.bubble2")}</h3>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-t-4 border-t-primary hover:shadow-lg transition-shadow">
                        <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                            <div className="p-4 rounded-full bg-primary/10">
                                <GraduationCap className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{ts("home.bubble3")}</h3>
                        </CardContent>
                    </Card>
                </div>

                {/* About + Disclaimer side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
                    <Card className="shadow-md">
                        <CardContent className="pt-6 pb-6 px-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-primary">About This App</h3>
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-sm">{ts('home.appBy')}</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardContent className="pt-6 pb-6 px-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-accent/10">
                                    <ShieldCheck className="w-5 h-5 text-accent" />
                                </div>
                                <h3 className="text-base font-semibold text-primary">Disclaimer</h3>
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-sm">{ts('home.disclaimer')}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Team section divider */}
            <div className="relative max-w-6xl mx-auto px-6 mb-8">
                <div className="absolute inset-0 flex items-center px-6">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                    <div className="flex items-center gap-2 bg-secondary px-4 py-1.5 rounded-full border border-border shadow-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{ts('home.meetTheTeam')}</span>
                    </div>
                </div>
            </div>

            {/* Team grid */}
            <section className="max-w-6xl mx-auto px-6 mb-16">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {members.map((member: TeamMember) => (
                        <Card
                            className="shadow-sm text-center hover:shadow-md hover:-translate-y-1 transition-all duration-150"
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
                                    <p className="text-muted-foreground text-xs mt-1 leading-snug">{ts(member.role)}</p>
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

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
import { useLocale } from "@/languageSupport/localeContext";
import { useTranslation } from "@/languageSupport/useTranslation";
import type {TranslationKey} from "@/languageSupport/keys.ts";

function Home() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    //team member data
    type ImageKey = keyof typeof teamPhotos;
    type TeamMember = {
        name: string;
        initials: string;
        role: TranslationKey;
        photo: ImageKey;
    }

    //members list, for displaying cards
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

            {/*Main Paragraph*/}
            <Card id="content" className="scroll-mt-25 shadow-lg max-w-5xl mx-auto mt-8 text-center py-8">
                <CardHeader>
                    <CardTitle className="text-4xl text-primary">{ts('home.mainHeader')}</CardTitle>
                    <CardDescription className="text-lg">{ts('home.subheader')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-md mt-4">{ts('home.disclaimer')}</p>
                    <div className="flex flex-row items-center justify-center gap-3 h-50">
                        <div className="flex flex-col items-center justify-center gap-5 w-60">
                            <h1 className="text-2xl">{ts('home.manageFiles')}</h1>
                            <LucideFolder className="w-15! h-15!"/>
                        </div>
                        <div className="self-stretch bg-primary w-px mx-4 my-4" />
                        <div className="flex flex-col items-center justify-center gap-5 w-60">
                            <h1 className="text-2xl">{ts('home.notLoggedIn')}</h1>
                            <User className="w-15! h-15!"/>
                        </div>
                        <div className="self-stretch bg-primary w-px mx-4 my-4" />
                        <div className="flex flex-col items-center justify-center gap-5 w-60">
                            <h1 className="text-2xl ">{ts("home.studentProject")}</h1>
                            <GraduationCap className="w-15! h-15!"/>
                        </div>
                    </div>

                    <p className="text-md mt-4">{ts('home.appBy')}</p>

                    <br />

                </CardContent>
            </Card>

            {/*team member cards*/}
            <section className="mt-12 max-w-7xl mx-auto mb-12">
                <h1 className="text-2xl font-bold text-primary text-center mb-8" >{ts('home.meetTheTeam')}</h1>
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
                                    <p className="text-muted-foreground">{ts(member.role)}</p>
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
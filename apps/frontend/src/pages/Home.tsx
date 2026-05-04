import {
    Card,
    CardContent
} from "@/components/ui/card.tsx"
import { Hero } from "@/components/shared/Hero.tsx";
import MeetTheTeam from "@/components/shared/MeetTheTeam.tsx"
import { Home as HomeIcon, LucideFolder, User, GraduationCap, ShieldCheck, BookOpen } from "lucide-react";
import { useLocale } from "@/languageSupport/localeContext";
import { useTranslation } from "@/languageSupport/useTranslation";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { useAuth0 } from "@auth0/auth0-react";

function Home() {

    usePageTitle("Home");

    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    const { loginWithRedirect } = useAuth0();

    return (
        <>
            <Hero
                icon={HomeIcon}
                title={ts('home.header')}
                description={ts('home.subheader')}
            />


            {/* Stats strip */}
            <div className="bg-primary-surface text-primary-foreground shadow-md">
                <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 divide-x divide-primary-foreground/20">

                    <div className="flex flex-col items-center gap-0.5 px-4">
                        <span className="text-3xl font-bold">Team B</span>
                        <span className="text-xs text-primary-foreground/70 uppercase tracking-widest">
                D-Term, 2025-26 Academic Year
            </span>
                    </div>

                    <div className="flex flex-col items-center gap-0.5 px-4">
                        <span className="text-3xl font-bold">CS3733</span>
                        <span className="text-xs text-primary-foreground/70 uppercase tracking-widest">
                Worcester Polytechnic Institute
            </span>
                    </div>

                </div>
            </div>

            {/* Welcome section */}
            <div id="content" className="scroll-mt-20 max-w-6xl mx-auto px-6 mt-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-primary">{ts('home.mainHeader')}</h1>
                    <p className="text-lg text-muted-foreground mt-2 max-w-xl mx-auto">The quiet infrastructure behind a better team.</p>
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

            <MeetTheTeam width="max-w-[1100px]" />

        </>



    )
}

export default Home;

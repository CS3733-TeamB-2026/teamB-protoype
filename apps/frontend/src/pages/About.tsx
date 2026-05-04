import {HelpCircle} from "lucide-react";
import {Hero} from "@/components/shared/Hero.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import MeetTheTeam from "@/components/shared/MeetTheTeam.tsx"
import { BookOpen, UserCheck, Building2, Briefcase, Heart } from "lucide-react";
import {usePageTitle} from "@/hooks/use-page-title.ts";

function About() {

    usePageTitle("About");

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

                <MeetTheTeam />

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
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover.tsx";
import {Quote, Users} from "lucide-react"
import {Button} from "@/components/ui/button.tsx";
import LinkedInIcon from "@/assets/LinkedIn-logo.png"
import {useState} from "react";
import {teamPhotos} from "@/components/ui/team-photos.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import type { TranslationKey } from "@/languageSupport/keys.ts";
import { useTranslation } from "@/languageSupport/useTranslation";
import {useLocale} from "@/languageSupport/localeContext.tsx";

export default function MeetTheTeam() {

    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    type ImageKey = keyof typeof teamPhotos;
    type TeamMember = {
        id: number //used for quote clicking
        name: string;
        initials: string;
        role: TranslationKey;
        photo: ImageKey;
        linkedin: string | null;
        quote: string;
    }

    const members: TeamMember[] = [
        { id: 1, name: "Dylan Zickus", initials: "DZ", role: 'role.lead', photo: "dylan",
            linkedin: "https://www.linkedin.com/in/dylan-zickus-a109892a8/",
            quote: "DYLAN QUOTE" },
        { id: 2, name: "Oscar Stomberg", initials: "OS", role: 'role.assistantLead', photo: "oscar",
            linkedin: "https://www.linkedin.com/in/oscar-w-stomberg/",
            quote: "OSCAR QUOTE" },
        { id: 3, name: "Jake Swanson", initials: "JS", role: 'role.assistantLead', photo: "jake",
            linkedin: "https://www.linkedin.com/in/jake-l-swanson/",
            quote: "JAKE QUOTE" },
        { id: 4, name: "Hayden Schultz", initials: "HS", role: 'role.assistantLeadAndScrumMaster', photo: "hayden",
            linkedin: "https://www.linkedin.com/in/hayden-schultz-819a7b39b/s",
            quote: "git add .env; git commit -m \"small changes\"; git push origin main --force" },
        { id: 5, name: "Luke Ciarletta", initials: "LC", role: 'role.fullTime', photo: "luke",
            linkedin: "https://www.linkedin.com/in/luke-ciarletta-150096357/",
            quote: "Did you prisma generate?" },
        { id: 6, name: "Nick Houghton", initials: "NH", role: 'role.fullTime', photo: "nicholas",
            linkedin: "https://www.linkedin.com/in/nick-houghton1/",
            quote: "NICK QUOTE" },
        { id: 7, name: "Cameron Pietraski", initials: "CP", role: 'role.fullTime', photo: "cameron",
            linkedin: "https://www.linkedin.com/in/cameron-pietraski-b43101353/",
            quote: "CAMERON QUOTE" },
        { id: 8, name: "Philip Ostrowski", initials: "PO", role: 'role.ptManager', photo: "philip",
            linkedin: "https://www.linkedin.com/in/philip-ostrowski-96911b384/",
            quote: "PHILIP QUOTE" },
        { id: 9, name: "Joseph Hemmerle", initials: "JH", role: 'role.ptOwner', photo: "joey",
            linkedin: "https://www.linkedin.com/in/joey-hemmerle-67b9b9288/",
            quote: "JOEY QUOTE" },
        { id: 10, name: "Ricardo Guzman Volpe", initials: "RG", role: 'role.ptAnalyst', photo: "ricardo",
            linkedin: null,
            quote: "Jarvis, drop all tables." }
    ]

    const [currentQuote, setCurrentQuote] = useState(0)

    const toggleQuote = (id: number) => {
        if (id == currentQuote) { setCurrentQuote(0) } //clicked same employee - toggle off
        else { setCurrentQuote(id) } //clicked new employee - set theirs to be on
    }

    return (
        <div>

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
                            className={`w-full max-w-55 shadow-sm border-t-primary border-t-4 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-150 relative`}
                            key={member.name}
                            onMouseLeave={() => toggleQuote(0)}
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
                                    <Popover open={member.id == currentQuote}>
                                        <PopoverTrigger /> {/*unused, but controls where the popover appears*/}
                                        <PopoverContent className="text-sm text-muted-foreground w-3xs text-center">
                                            {member.quote}
                                        </PopoverContent>
                                    </Popover>
                                    <Button
                                        variant="outline"
                                        className ="m-1 absolute bottom-1/32 left-1/32"
                                        onClick={() => toggleQuote(member.id)}
                                    >
                                        <Quote className="text-muted-foreground" />
                                    </Button>
                                    {member.linkedin && (
                                        <a href={member.linkedin} target="_blank">
                                            <Button
                                                variant="outline"
                                                className = "w-8 m-1 absolute bottom-1/32 right-1/32"
                                            >
                                                <img src={LinkedInIcon} alt="LinkedIn" />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    )
}

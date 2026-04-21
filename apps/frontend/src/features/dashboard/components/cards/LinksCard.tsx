import {Card, CardContent, CardTitle} from "@/components/ui/card.tsx";
import { Link } from "react-router-dom";
import { useUser } from "@/hooks/use-user.ts";

type LinkItem = {
    title: string;
    href: string;
    access: string[];
}

const links: LinkItem[] = [
    { title: "Desktop Management Tool", href: "/", access: ["admin", "underwriter"] },
    { title: "States on Hold", href: "/", access: ["admin", "underwriter"] },
    { title: "RiskMeter Online", href: "/", access: ["admin", "underwriter"] },
    { title: "ISOnet Website", href: "/", access: ["admin", "underwriter"] },
    { title: "Forms Knowledge Base", href: "/", access: ["admin, underwriter"] },
    { title: "Experience & Schedule Rating Plans", href: "/", access: ["admin", "underwriter"] },
    { title: "Property View", href: "/", access: ["admin", "underwriter"] },
    { title: "Coastal Guidelines", href: "/", access: ["admin", "underwriter"] },
    { title: "IPS (Image & Processing System)", href: "/", access: ["admin", "underwriter"] },
    { title: "Underwriting Workstation", href: "/", access: ["admin", "underwriter"] },

    { title: "States on Hold", href: "/", access: ["admin", "businessAnalyst"] },
    { title: "Forms Knowledge Base", href: "/", access: ["admin", "businessAnalyst"] },
    { title: "IPS (Image & Processing System)", href: "/", access: ["admin", "businessAnalyst"] },
    { title: "CPP Rater Resource Site", href: "/", access: ["admin", "businessAnalyst"] },
    { title: "PMS URG", href: "/", access: ["admin", "businessAnalyst"] },
    { title: "Kentucky Tax and Tax Exemption Job Aid", href: "/", access: ["admin", "businessAnalyst"] },
    { title: "Underwriting Workstation", href: "/", access: ["admin, businessAnalyst"] },
    { title: "Experience & Schedule Rating Plans", href: "/", access: ["admin, businessAnalyst"] },
    { title: "Error Lookup Tool", href: "/", access: ["admin, businessAnalyst"] },
    { title: "Workaround Tool", href: "/", access: ["admin, businessAnalyst"] }
]

function HelloCard() {
    const {user} = useUser();

    return (
        <Card className="lg:col-span-1 py-8 px-4 shadow-lg hover:scale-101 transition-transform">
            <CardTitle className="capitalize text-2xl font-semibold text-center">
                <h1>Additional Links:</h1>
            </CardTitle>
            <CardContent>
                <div className="flex flex-wrap gap-3">
                    {links
                        .filter(item => item.access.length === 0 || (user && item.access.includes(user.persona)))
                        .map(item => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="w-full justify-start gap-3 px-3 py-1 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none">
                                {item.title}
                            </Link>
                        ))
                    }
                </div>
            </CardContent>
        </Card>
    );
}

export default HelloCard;
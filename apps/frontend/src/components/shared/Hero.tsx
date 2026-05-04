import banner from "@/assets/hanover_banner.webp";
import { type LucideIcon } from "lucide-react";
import InfoButton from "@/components/layout/InformationAlert.tsx";

export type HeroIcon = "home" | "employees" | "content";

export function Hero(properties: { icon?: LucideIcon | null, title: string, description?: string, infoContent?: React.ReactNode }) {
    return (
        <div className="relative flex items-stretch min-h-64 text-primary-foreground shadow-xl overflow-hidden">

            <div
                className="absolute inset-0 bg-cover"
                style={{
                    backgroundImage: `url(${banner})`,
                    backgroundPosition: "center 25%",
                    backgroundSize: "cover",
                    minWidth: "100vw",
                    left: "50%",
                    transform: "translateX(-30%)",
                }}
            />

            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(to right, var(--primary-surface) 30%, rgba(27,58,92,0.75) 50%, transparent 100%)",
                }}
            />

            <div className="relative z-10 flex flex-col justify-center py-20 px-12 max-w-xl">
                { properties.icon
                    ? <properties.icon className="w-8 h-8 mb-4 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]"/>
                    : null
                }
                <div className="flex items-center gap-3 mb-4">
                    <h1
                        className="text-3xl font-bold text-primary-foreground"
                        style={{ textShadow: "0 0 30px rgba(0,0,0,0.9), 0 0 50px rgba(0,0,0,0.6)" }}
                    >
                        {properties.title}
                    </h1>
                    {properties.infoContent && (
                        <div style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.9))" }}>
                            <InfoButton content={properties.infoContent} size="w-6 h-6" />
                        </div>
                    )}
                </div>
                <p
                    className="text-lg text-primary-foreground/90"
                    style={{ textShadow: "0 0 20px rgba(0,0,0,1)" }}
                >
                    {properties.description}
                </p>
            </div>
        </div>
    )
}

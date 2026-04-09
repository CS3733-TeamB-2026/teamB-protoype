import banner from "@/assets/hanover_banner.webp";
import { type LucideIcon } from "lucide-react";

export type HeroIcon = "home" | "employees" | "content";

export function Hero(properties: { icon?: LucideIcon | null, title: string, description?: string }) {
    return (
        <div className="relative flex flex-col items-center justify-center py-20 px-8 text-primary-foreground shadow-xl overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${banner})`,
                    backgroundPosition: "center 38%",
                    backgroundSize: "cover",
                    minWidth: "100vw",
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-white/50 via-transparent to-white/50" />
            <div
                className="relative z-10 text-center flex flex-col items-center rounded-lg py-6 px-8"
                style={{
                    background:
                        "radial-gradient(ellipse, rgba(0,0,0,.9) 0%, transparent 70%)",
                    backgroundSize: "105% 105%",
                    backgroundPosition: "center",
                }}
            >
                <h1
                    className="text-5xl font-bold text-primary-foreground "
                    style={{
                        textShadow:
                            "0 0 30px rgba(0,0,0,.9), 0 0 50px rgba(0,0,0,.6)",
                    }}
                >
                    {properties.title}
                </h1>
                <p
                    className="text-lg mb-8 mt-4 text-primary-foreground"
                    style={{
                        textShadow:
                            "0 0 30px rgba(0,0,0,1), 0 0 50px rgba(0,0,0,1)",
                    }}
                >
                    {properties.description}
                </p>
            </div>

            { properties.icon ?
                <properties.icon className="w-8 h-8 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]"/>
                :
                null
            }

        </div>
    )
}

import {
    Card,
    CardContent
} from "@/components/ui/card.tsx"
import { Hero } from "@/components/shared/Hero.tsx";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/carousel";
import { Boxes } from "lucide-react";
import ExpressIMG from "@/assets/Logos/expressIMG.png";
import SupabaseIMG from "@/assets/Logos/supabaseIMG.jpeg";
import ShadIMG from "@/assets/Logos/shadIMG.png";
import PrismaIMG from "@/assets/Logos/prismaIMG.png";
import PostgresqlIMG from "@/assets/Logos/postgresqlIMG.png";
import TailwindIMG from "@/assets/Logos/tailwindIMG.png";
import ReactIMG from "@/assets/Logos/reactIMG.png";
import Auth0IMG from "@/assets/Logos/auth0IMG.jpg";

import { usePageTitle } from "@/hooks/use-page-title.ts";

function Credits() {

    usePageTitle("Home");

    return (
        <>
            <Hero
                icon={Boxes}
                title={'Credits'}
                description={'Acknowledging the tools that made this project possible.'} // TODO: Make this work with locale
            />

            <div className="mt-12">
                <Carousel
                    className="w-full max-w-6xl mx-auto"
                    opts={{ loop: true }}
                >
                    <CarouselContent>

                        {/* React */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-primary hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://react.dev" target="_blank" className="text-primary underline text-sm">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={ReactIMG}
                                                    alt="react"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">React</h3>
                                    <p className="text-sm text-muted-foreground">
                                        The core UI library powering our frontend .
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                        {/* Shadcn UI */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://ui.shadcn.com" target="_blank" className="text-accent underline text-sm">
                                        <div className="p-4 rounded-full bg-accent/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={ShadIMG}
                                                    alt="shadcn"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">shadcn/ui</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Beautiful, accessible components built on Radix and Tailwind.
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                        {/* Prisma */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-primary hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://prisma.io" target="_blank" className="text-primary underline text-sm">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={PrismaIMG}
                                                    alt="prisma"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">Prisma ORM</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Type-safe database access and schema management.
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                        {/* PostgreSQL */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-primary hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://postgresql.org" target="_blank" className="text-primary underline text-sm">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={PostgresqlIMG}
                                                    alt="postgresql"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">PostgreSQL</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Reliable, powerful open‑source relational database.
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                        {/* Express */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://expressjs.com" target="_blank" className="text-accent underline text-sm">
                                        <div className="p-4 rounded-full bg-accent/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={ExpressIMG}
                                                    alt="express"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">Express.js</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Minimalist backend framework powering our API.
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                        {/* Tailwind */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-primary hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://tailwindcss.com" target="_blank" className="text-primary underline text-sm">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={TailwindIMG}
                                                    alt="tailwind"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">Tailwind CSS</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Utility‑first CSS framework used across the app.
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                        {/* Supabase */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://supabase.com" target="_blank" className="text-accent underline text-sm">
                                        <div className="p-4 rounded-full bg-accent/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={SupabaseIMG}
                                                    alt="supabase"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">Supabase</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Open‑source backend platform for auth and storage.
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                        {/* auth0 */}
                        <CarouselItem className="md:basis-1/3">
                            <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                                <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-8 px-6">
                                    <a href="https://auth0.com" target="_blank" className="text-accent underline text-sm">
                                        <div className="p-4 rounded-full bg-accent/10">
                                            <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden">
                                                <img
                                                    src={Auth0IMG}
                                                    alt="auth0"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </a>
                                    <h3 className="text-base font-semibold text-foreground">Auth0</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Security system to track logins.
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                    </CarouselContent>

                    <CarouselPrevious className="shadow-md hover:shadow-lg transition-shadow"/>
                    <CarouselNext className="shadow-md hover:shadow-lg transition-shadow" />
                </Carousel>
            </div>
            <div className="mt-12"/>

        </>
    )
}

export default Credits;

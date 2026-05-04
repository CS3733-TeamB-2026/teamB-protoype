import {
    Card,
    CardContent,
    CardHeader
} from "@/components/ui/card.tsx";
import { Hero } from "@/components/shared/Hero.tsx";
import Autoplay from "embla-carousel-autoplay";
import {
    Carousel,
    CarouselContent,
    CarouselItem
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
import NodeIMG from "@/assets/Logos/nodeIMG.png"

import { usePageTitle } from "@/hooks/use-page-title.ts";

Autoplay({
    delay: 2000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
})

function Credits() {

    usePageTitle("Credits");

    return (
        <>
            <Hero
                icon={Boxes}
                title={'Credits'}
                description={'Acknowledging the tools that made this project possible.'} // TODO: Make this work with locale
            />

            <h1 className='text-center text-4xl text-primary font-semibold mt-6 mb-1'>Tools Used:</h1>
            <p className="text-center text-muted-foreground mb-4">This project was made possible through these tools and technologies.</p>

            <Card className="shadow-xl border-t-4 border-t-primary p-4 bg-linear-to-br from-primary to-primary-light/30 transition-shadow w-full max-w-6xl mx-auto mt-6">
                <CardHeader className="text-white text-2xl">
                    PERN Stack:
                </CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                        <CardContent className="flex flex-col items-center text-center gap-4 pt-4 pb-4 px-6">
                            <a href="https://postgresql.org" target="_blank" className="text-primary underline text-sm">
                                <div className="p-4 rounded-full bg-primary/10">
                                    <div className="w-35 h-35 flex items-center justify-center rounded-full">
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
                    <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                        <CardContent className="flex flex-col items-center text-center gap-4 pt-4 pb-4 px-6">
                            <a href="https://expressjs.com" target="_blank" className="text-accent underline text-sm">
                                <div className="p-4 rounded-full bg-accent/10">
                                    <div className="w-35 h-35 flex items-center justify-center rounded-full overflow-hidden">
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
                    <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                        <CardContent className="flex flex-col items-center text-center gap-4 pt-4 pb-4 px-6">
                            <a href="https://react.dev" target="_blank" className="text-primary underline text-sm">
                                <div className="p-4 rounded-full bg-primary/10">
                                    <div className="w-35 h-35 flex items-center justify-center rounded-full overflow-hidden">
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
                    <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
                        <CardContent className="flex flex-col items-center text-center gap-4 pt-4 pb-4 px-6">
                            <a href="https://nodejs.org/en" target="_blank" className="text-primary underline text-sm">
                                <div className="p-4 rounded-full bg-primary/10">
                                    <div className="w-35 h-35 flex items-center justify-center rounded-full overflow-hidden">
                                        <img
                                            src={NodeIMG}
                                            alt="node.js"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </a>
                            <h3 className="text-base font-semibold text-foreground">NodeJS</h3>
                            <p className="text-sm text-muted-foreground">
                                Event‑driven backend engine that keeps our API responsive under load.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </Card>

            <Card className="shadow-xl border-t-4 border-t-primary bg-linear-to-br from-primary to-primary-light/30 p-4 transition-shadow w-full max-w-6xl mx-auto mt-12">
            <CardHeader className="text-white text-2xl">
                Other Tools:
            </CardHeader>

                <Carousel
                    opts={{ loop: true }}
                    plugins={[
                        Autoplay({
                            delay: 3000,      // 3 seconds between slides
                            stopOnInteraction: false,
                        })
                    ]}
                >
                    <CarouselContent>

                        {/* Shadcn UI */}
                        <CarouselItem className="md:basis-1/4">
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
                        <CarouselItem className="md:basis-1/4">
                            <Card className="shadow-md border-t-4 border-t-primary-dark hover:shadow-lg transition-shadow h-80">
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

                        {/* Tailwind */}
                        <CarouselItem className="md:basis-1/4">
                            <Card className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow h-80">
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
                        <CarouselItem className="md:basis-1/4">
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
                        <CarouselItem className="md:basis-1/4">
                            <Card className="shadow-md border-t-4 border-t-primary-dark hover:shadow-lg transition-shadow h-80">
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
                </Carousel>
            <div className="mt-6"/>
            </Card>
            <div className="mt-6"/>
        </>
    )
}

export default Credits;

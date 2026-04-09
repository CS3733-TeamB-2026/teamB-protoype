import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card"
import banner from "@/assets/hanover_banner.webp";

function Underwriter() {

    type PersonaLink = {
        name: string;
        url: string;
    }

    const links : PersonaLink[] = [
        { name: "Desktop Management Tool", url: "#" },
        { name: "States on Hold", url: "#" },
        { name: "RiskMeter Online", url: "#" },
        { name: "ISOnet Website", url: "#" },
        { name: "Forms Knowledge Base", url: "#" },
        { name: "Experience & Schedule Rating Plans", url: "#" },
        { name: "Property View", url: "#" },
        { name: "Coastal Guidelines", url: "#" },
        { name: "IPS (Image & Processing System)", url: "#" },
        { name: "Underwriting Workstation", url: "#" }
    ];

    return (
        <>
            {/*Header/Hero Section (includes links)*/}
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
                    >Persona - Underwriter</h1>

                    <p
                        className="text-lg mb-8 mt-4 text-primary-foreground"
                        style={{
                            textShadow:
                                "0 0 30px rgba(0,0,0,1), 0 0 50px rgba(0,0,0,1)",
                        }}
                    >Persona Page</p>

                    <h2 className="text-2xl font-bold mb-1">Helpful Links:</h2>

                    {/*Links*/}
                    <div className="flex flex-wrap justify-center gap-3 mx-auto max-w-5xl">
                        {links.map((link : PersonaLink) => (
                            <a href={link.url}>
                                <Card className="bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                                    <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                        {link.name}
                                    </CardContent>
                                </Card>
                            </a>
                        ))}
                    </div>

                </div>
            </div>

            {/*Persona Section*/}
            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">My Persona</CardTitle>
                </CardHeader>
                <CardContent className="text-left px-10">
                    <h1 className="text-lg">About Me:</h1> <br/>
                    <p>
                        I assess risk and ensure policies comply with guidelines. I rely on iBank for quick access
                        to underwriting rules, filing information, and state-specific requirements. Accuracy and
                        speed are critical because my decisions directly affect revenue and compliance.
                    </p> <br/>
                    <h1 className="text-lg">I may think and say:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>“What’s the eligibility guideline for this risk?”</li>
                        <li>“I need the latest flood underwriting rules.”</li>
                        <li>“Is this filing approved for this state?”</li>
                    </ul> <br />
                    <h1 className="text-lg">My Goal:</h1> <br/>
                    <p>
                        Make informed underwriting decisions quickly and accurately.
                    </p> <br/>
                    <h1 className="text-lg">Skills:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Risk assessment</li>
                        <li>Regulatory compliance</li>
                        <li>Decision-making under pressure</li>
                        <li>Attention to detail</li>
                    </ul> <br />
                    <h1 className="text-lg">Critical Capabilities (1-5):</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Integrated Thinking: <b>4</b></li>
                        <li>Change Readiness: <b>3</b></li>
                        <li>Consultative: <b>3</b></li>
                        <li>Business / IT Fluency: <b>3</b></li>
                        <li>Shift Left Mindset: <b>2</b></li>
                        <li>Peer Networking: <b>3</b></li>
                    </ul> <br />
                    <h1 className="text-lg">Typical Traits:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Analytical</li>
                        <li>Precise</li>
                        <li>Deadline-Driven</li>
                    </ul> <br />
                    <h1 className="text-lg">Frequency of Access & Criticality:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li><b>Access:</b> Daily</li>
                        <li><b>Criticality:</b> Very High — inability to access guidelines halts underwriting</li>
                    </ul> <br />
                </CardContent>
            </Card>

        </>
    );
}

export default Underwriter;
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";

function BusinessAnalyst() {

    type PersonaLink = {
        name: string;
        url: string;
    }

    const links : PersonaLink[] = [
        { name: "States on Hold", url: "#" },
        { name: "Forms Knowledge Base", url: "#" },
        { name: "IPS (Image & Processing System)", url: "#" },
        { name: "Underwriting Workstation", url: "#" },
        { name: "CPP Rater Resource Site", url: "#" },
        { name: "PMS URG", url: "#" },
        { name: "Kentucky Tax and Tax Exemption Job Aid", url: "#" },
        { name: "Experience & Schedule Rating Plans", url: "#" },
        { name: "Error Lookup Tool", url: "#" },
        { name: "Workaround Tool", url: "#" }
    ];

    return (
        <>
            {/*hero header*/}
            <div className="flex flex-col items-center justify-center pt-15 pb-4 px-8 bg-secondary-foreground text-primary-foreground">
                <h1 className="text-4xl font-bold mb-4">Persona - Business Analyst</h1>
                <p className="text-lg mb-8 text-primary-foreground/80">Persona Page</p>

                <h2 className="text-2xl font-bold mb-1">Helpful Links:</h2>

                {/*links*/}
                <div className="flex flex-wrap justify-center gap-3 mx-auto max-w-5xl my-4">

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

            {/*persona section*/}
            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">My Persona</CardTitle>
                </CardHeader>
                <CardContent className="text-left px-10">
                    <h1 className="text-lg">About Me:</h1> <br/>
                    <p>
                        I validate workflows and system entry procedures. I use iBank to confirm updates and
                        answer end-user questions. My role ensures smooth integration between business
                        processes and technology.
                    </p> <br/>
                    <h1 className="text-lg">I may think and say:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>“Does this procedure reflect the latest system enhancement?”</li>
                        <li>“I need to confirm the ACT guide before responding.”</li>
                        <li>“How do we streamline this workflow?”</li>
                    </ul> <br />
                    <h1 className="text-lg">My Goal:</h1> <br/>
                    <p>
                        Ensure accurate documentation and seamless process integration.
                    </p> <br/>
                    <h1 className="text-lg">Skills:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Workflow analysis</li>
                        <li>System validation</li>
                        <li>Communication</li>
                        <li>Problem-solving</li>
                    </ul> <br />
                    <h1 className="text-lg">Critical Capabilities (1-5):</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Integrated Thinking: <b>4</b></li>
                        <li>Change Readiness: <b>4</b></li>
                        <li>Consultative: <b>4</b></li>
                        <li>Business / IT Fluency: <b>4</b></li>
                        <li>Shift Left Mindset: <b>3</b></li>
                        <li>Peer Networking: <b>4</b></li>
                    </ul> <br />
                    <h1 className="text-lg">Typical Traits:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Analytical</li>
                        <li>Collaborative</li>
                        <li>Detail-Oriented</li>
                    </ul> <br />
                    <h1 className="text-lg">Frequency of Access & Criticality:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li><b>Access:</b> Weekly</li>
                        <li><b>Criticality:</b> High — incorrect workflows disrupt operations</li>
                    </ul> <br />
                    <h1 className="text-lg">Content Accessed:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>User reference guides</li>
                        <li>System entry procedures</li>
                    </ul> <br />
                </CardContent>
            </Card>
        </>
    );
}

export default BusinessAnalyst;
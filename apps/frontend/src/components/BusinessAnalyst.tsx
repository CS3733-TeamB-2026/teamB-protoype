import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";

function BusinessAnalyst() {
    return (
        <>
            {/*Header/Hero Section (includes links)*/}
            <div className="flex flex-col items-center justify-center pt-15 pb-4 px-8 bg-secondary-foreground text-primary-foreground">
                <h1 className="text-4xl font-bold mb-4">Persona - Business Analyst</h1>
                <p className="text-lg mb-8 text-primary-foreground/80">Persona Page</p>

                <h2 className="text-2xl font-bold mb-1">Helpful Links:</h2>

                {/*Links*/}
                <div className="flex flex-wrap justify-center gap-3 mx-auto max-w-5xl my-4">
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                States on Hold
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                Forms Knowledge Base
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                IPS (Image & Processing System)
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                Underwriting Workstation
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                CPP Rater Resource Site
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                PMS URG
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                Kentucky Tax and Tax Exemption Job Aid
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                Experience & Schedule Rating Plans
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                Error Lookup Tool
                            </CardContent>
                        </Card>
                    </a>
                    <a href="#">
                        <Card className="border-3 border-secondary bg-primary shadow-lg hover:bg-secondary hover:text-secondary-foreground transition-all cursor-pointer active:scale-[0.98] text-primary-foreground">
                            <CardContent className="px-4 py-1/2 text-center font-semibold text-shadow-xs">
                                Workaround Tool
                            </CardContent>
                        </Card>
                    </a>
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
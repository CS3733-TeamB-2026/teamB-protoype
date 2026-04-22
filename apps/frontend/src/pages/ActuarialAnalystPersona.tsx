import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Hero} from "@/components/shared/Hero.tsx";
import {User} from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title.ts";

function ActuarialAnalystPersona() {

    usePageTitle("Actuarial Analyst Persona");

    return (
        <>

            <Hero
                icon={User}
                title="Persona - Actuarial Analyst"
            />

            {/*persona section*/}
            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">My Persona</CardTitle>
                </CardHeader>
                <CardContent className="text-left px-10">
                    <h1 className="text-lg">About Me:</h1> <br/>
                    <p>
                        I maintain and validate rate information and rating tools. I use iBank to ensure compliance and accuracy in
                        pricing models. My work supports profitability and regulatory adherence, so I need reliable access to
                        technical content.
                    </p> <br/>
                    <h1 className="text-lg">I may think and say:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>“Are these rates updated for the new filing?”</li>
                        <li>“I need to confirm the class table before publishing.”</li>
                        <li>“Does this tool reflect the latest approved changes?”</li>
                    </ul> <br />
                    <h1 className="text-lg">My Goal:</h1> <br/>
                    <p>
                        Provide accurate rate and pricing information to support underwriting and compliance.
                    </p> <br/>
                    <h1 className="text-lg">Skills:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Statistical analysis</li>
                        <li>Rate validation</li>
                        <li>Regulatory compliance</li>
                        <li>Tool maintenance</li>
                    </ul> <br />
                    <h1 className="text-lg">Critical Capabilities (1-5):</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Integrated Thinking: <b>4</b></li>
                        <li>Change Readiness: <b>3</b></li>
                        <li>Consultative: <b>3</b></li>
                        <li>Business / IT Fluency: <b>4</b></li>
                        <li>Shift Left Mindset: <b>3</b></li>
                        <li>Peer Networking: <b>3</b></li>
                    </ul> <br />
                    <h1 className="text-lg">Typical Traits:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Analytical</li>
                        <li>Detail-oriented</li>
                        <li>Compliance-focused</li>
                    </ul> <br />
                    <h1 className="text-lg">Frequency of Access & Criticality:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li><b>Access:</b> Weekly</li>
                        <li><b>Criticality:</b> High — incorrect rates impact revenue and compliance</li>
                    </ul> <br />
                    <h1 className="text-lg">Content Accessed:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Rate lookup tools</li>
                        <li>Class tables</li>
                        <li>State grids</li>
                    </ul> <br />
                </CardContent>
            </Card>
        </>
    );
}

export default ActuarialAnalystPersona;
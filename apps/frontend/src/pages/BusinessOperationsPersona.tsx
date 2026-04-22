import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Hero} from "@/components/shared/Hero.tsx";
import {User} from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title.ts";

function BusinessOperationsPersona() {

    usePageTitle("Business Operations Persona");

    return (
        <>

            <Hero
                icon={User}
                title="Persona - Business Operations"
            />

            {/*persona section*/}
            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">My Persona</CardTitle>
                </CardHeader>
                <CardContent className="text-left px-10">
                    <h1 className="text-lg">About Me:</h1> <br/>
                    <p>
                        I calculate premiums and follow rating workflows. I depend on iBank for tools and procedures that ensure
                        accuracy. My role is critical for policy pricing and compliance.
                    </p> <br/>
                    <h1 className="text-lg">I may think and say:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>“What’s the BUR procedure for this class?”</li>
                        <li>“I need the Prometrix tool for this calculation.”</li>
                        <li>“Is the BaRR portal updated?”</li>
                    </ul> <br />
                    <h1 className="text-lg">My Goal:</h1> <br/>
                    <p>
                        Accurately calculate premiums and follow rating workflows without delays.
                    </p> <br/>
                    <h1 className="text-lg">Skills:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Rating calculations</li>
                        <li>Workflow adherence</li>
                        <li>Detail orientation</li>
                    </ul> <br />
                    <h1 className="text-lg">Critical Capabilities (1-5):</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Integrated Thinking: <b>3</b></li>
                        <li>Change Readiness: <b>3</b></li>
                        <li>Consultative: <b>2</b></li>
                        <li>Business / IT Fluency: <b>3</b></li>
                        <li>Shift Left Mindset: <b>2</b></li>
                        <li>Peer Networking: <b>2</b></li>
                    </ul> <br />
                    <h1 className="text-lg">Typical Traits:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Precise</li>
                        <li>Task-focused</li>
                        <li>Dependable</li>
                    </ul> <br />
                    <h1 className="text-lg">Frequency of Access & Criticality:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li><b>Access:</b> Daily</li>
                        <li><b>Criticality:</b> High — inability to access tools halts rating</li>
                    </ul> <br />
                    <h1 className="text-lg">Content Accessed:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Rating tools</li>
                        <li>Workflow documentation</li>
                    </ul> <br />
                </CardContent>
            </Card>
        </>
    );
}

export default BusinessOperationsPersona;
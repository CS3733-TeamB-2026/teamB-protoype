import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Hero} from "@/components/shared/Hero.tsx";
import {User} from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title.ts";

function EXLOperationsPersona() {

    usePageTitle("EXL Operations Persona");

    return (
        <>

            <Hero
                icon={User}
                title="Persona - EXL Operations"
            />

            {/*persona section*/}
            <Card className="shadow-lg max-w-5xl mx-auto my-8 text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">My Persona</CardTitle>
                </CardHeader>
                <CardContent className="text-left px-10">
                    <h1 className="text-lg">About Me:</h1> <br/>
                    <p>
                        I process assigned work using detailed procedures and rating tools. I rely on iBank for step-by-step
                        instructions and calculations that cannot be automated. Accuracy is essential because errors affect policy
                        issuance.
                    </p> <br/>
                    <h1 className="text-lg">I may think and say:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>“What’s the exception process for this state?”</li>
                        <li>“I need the BUR procedure for this rating.”</li>
                        <li>“Where’s the property amend limits tool?”</li>
                    </ul> <br />
                    <h1 className="text-lg">My Goal:</h1> <br/>
                    <p>
                        Complete assigned tasks accurately and efficiently using correct procedures.
                    </p> <br/>
                    <h1 className="text-lg">Skills:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Task execution</li>
                        <li>Attention to detail</li>
                        <li>Following complex workflows</li>
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
                        <li>Process-driven</li>
                        <li>Reliable</li>
                        <li>Detail-focused</li>
                    </ul> <br />
                    <h1 className="text-lg">Frequency of Access & Criticality:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li><b>Access:</b> Daily</li>
                        <li><b>Criticality:</b> High — inability to access procedures halts work</li>
                    </ul> <br />
                    <h1 className="text-lg">Content Accessed:</h1> <br/>
                    <ul className="list-disc list-inside text-left mx-auto text-md">
                        <li>Workflow documentation</li>
                        <li>Rating tools</li>
                    </ul> <br />
                </CardContent>
            </Card>
        </>
    );
}

export default EXLOperationsPersona;
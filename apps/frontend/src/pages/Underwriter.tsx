import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card.tsx"
import {Hero} from "@/components/shared/Hero.tsx";
import { User } from "lucide-react";

function Underwriter() {

    return (
        <>

            <Hero
                icon={User}
                title="Persona - Underwriter"
            />

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
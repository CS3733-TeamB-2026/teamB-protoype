import {Card, CardContent} from "@/components/ui/card.tsx";
import {Clock} from "lucide-react";
import {useEffect, useState} from "react";

function ClockCard() {

    const [currentDateTime, setCurrentDateTime] = useState({
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        time: new Date().toLocaleTimeString()
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentDateTime({
                day: now.toLocaleDateString('en-US', { weekday: 'long' }),
                time: now.toLocaleTimeString()
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="shadow-lg hover:scale-101 transition-transform px-4 py-4 flex flex-row justify-center items-center">
            <CardContent className="p-0">
                <div className="flex flex-row items-center gap-5 justify-center">
                    <Clock className="w-15! h-15!"/>
                    <p className="text-lg font-semibold">It is {currentDateTime.time} on {currentDateTime.day}.</p>
                </div>
            </CardContent>
        </Card>
    );
}
export default ClockCard;
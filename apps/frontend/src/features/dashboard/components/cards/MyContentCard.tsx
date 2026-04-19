import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import MyFiles from "@/features/content/listing/MyFiles.tsx";

function MyContentCard() {
    return (
        <Card className="shadow-lg hover:scale-101 transition-transform md:col-span-2 px-4 py-8">
            <CardHeader className="text-left text-2xl! font-semibold">My Files: </CardHeader>
            <CardContent>
                <MyFiles/>
            </CardContent>
        </Card>
    );
}

export default MyContentCard;
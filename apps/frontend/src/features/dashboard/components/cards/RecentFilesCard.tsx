import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import RecentFiles from "@/features/content/listing/RecentFiles.tsx";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {FolderOpen} from "lucide-react";

function RecentFilesCard() {
    return (
        <Card className="border-t-secondary border-t-4 shadow-lg hover:scale-101 transition-transform md:col-span-3 px-4 py-8">
            <CardHeader className="text-left text-2xl! font-semibold">Recent Files: </CardHeader>
            <CardContent>
                <RecentFiles />
                <Link to="/files" className="w-full">
                    <Button className="mt-5 w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        View Files
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

export default RecentFilesCard;
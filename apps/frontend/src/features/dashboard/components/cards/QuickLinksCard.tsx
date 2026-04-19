import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {FolderOpen, Plus, UserPlus, Users} from "lucide-react";
import { useUser } from "@/hooks/use-user.ts"

function QuickLinksCard() {

    const user = useUser();

    return (
        <Card className="shadow-lg hover:scale-101 transition-transform">
            <CardHeader>
                <CardTitle className="capitalize text-2xl font-semibold text-center">
                    User Access: {user?.persona}
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground">Quick Links</p>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3 px-2">
                    {user?.persona === "admin" ?
                        <Link to="/usermanagement" className="w-full">
                            <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                <Users className="w-4 h-4 shrink-0" />
                                View Users
                            </Button>
                        </Link>
                        :
                        null
                    }
                    {user?.persona === "admin" ?
                        <Link to="/employeeform" className="w-full">
                            <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                                <UserPlus className="w-4 h-4 shrink-0" />
                                Add Employee
                            </Button>
                        </Link>
                        :
                        null
                    }
                    <Link to="/files" className="w-full">
                        <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                            <FolderOpen className="w-4 h-4 shrink-0" />
                            View Files
                        </Button>
                    </Link>
                    <Link to="/manageform" className="w-full">
                        <Button className="w-full justify-start gap-3 px-4 py-5 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-accent hover:text-primary-foreground transition-all active:brightness-90 shadow-none" variant="outline">
                            <Plus className="w-4 h-4 shrink-0" />
                            Add Content
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default QuickLinksCard;
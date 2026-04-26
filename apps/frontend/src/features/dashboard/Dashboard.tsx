//import { useUser } from "@/hooks/use-user.ts";
import {Hero} from "@/components/shared/Hero.tsx";
import {LayoutDashboard} from "lucide-react"
import { usePageTitle } from "@/hooks/use-page-title.ts";
import {DEFAULT_LAYOUT, WIDGET_REGISTRY, type WidgetSize} from "@/features/dashboard/widget-registry.ts";

const layout = DEFAULT_LAYOUT;

const sizeClasses: Record<WidgetSize, string> = {
    small: "col-span-1",
    medium: "md:col-span-2",
    full: "md:col-span-2 lg:col-span-3",
}

function Dashboard() {

    usePageTitle("Dashboard");
    //const user = useUser();

    return (
        <>
            {/* Hero */}
            <Hero
                icon={LayoutDashboard}
                description="Find all your tools here."
                title="Dashboard"
            />

            {/* Display Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 mx-15">
                {
                    layout.filter(w => w.visible).map(({id, size}) => {
                        const Card = WIDGET_REGISTRY[id].component;
                        return (
                            <div key={id} className={`${sizeClasses[size]} h-full`}>
                                <Card />
                            </div>
                        )
                    })
                }
            </div>

        </>
    )
}

export default Dashboard;
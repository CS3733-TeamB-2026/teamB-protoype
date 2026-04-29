//import { useUser } from "@/hooks/use-user.ts";
import {Hero} from "@/components/shared/Hero.tsx";
import {LayoutDashboard} from "lucide-react"
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { WIDGET_REGISTRY, type WidgetSize} from "@/features/dashboard/widget-registry.ts";
import DashboardCustomizeSheet from "@/features/dashboard/components/DashboardCustomizeSheet.tsx";
import { useDashboardLayout } from "@/features/dashboard/use-dashboard-layout.ts"
import { Loader2 } from "lucide-react";

const sizeClasses: Record<WidgetSize, string> = {
    small: "col-span-1",
    medium: "md:col-span-2",
    full: "md:col-span-2 lg:col-span-3",
}

function Dashboard() {

    usePageTitle("Dashboard");
    //const user = useUser();

    const { layout, setLayout, isLoading } = useDashboardLayout();

    if (isLoading) {
        return (
            <>
                <Hero icon={LayoutDashboard} description="Find all your tools here." title="Dashboard" />
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </>
        );
    }

    return (
        <>
            {/* Hero */}
            <Hero
                icon={LayoutDashboard}
                description="Find all your tools here."
                title="Dashboard"
            />

            {/* Display Cards */}
            <div className="flex flex-row items-center justify-end mx-25 mt-6">
                <DashboardCustomizeSheet layout={layout} setLayout={setLayout} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 py-4 mx-15">
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
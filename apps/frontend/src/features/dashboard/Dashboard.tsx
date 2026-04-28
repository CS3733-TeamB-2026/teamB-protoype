//import { useUser } from "@/hooks/use-user.ts";
import {Hero} from "@/components/shared/Hero.tsx";
import {LayoutDashboard} from "lucide-react"
import { usePageTitle } from "@/hooks/use-page-title.ts";
import BookmarkedCard from "@/features/dashboard/components/cards/BookmarkedCard"
import ClockCard from "@/features/dashboard/components/cards/ClockCard"
import HelloCard from "@/features/dashboard/components/cards/HelloCard"
import MyContentCard from "@/features/dashboard/components/cards/MyContentCard.tsx";
import QuickLinksCard from "@/features/dashboard/components/cards/QuickLinksCard.tsx";
import RecentFilesCard from "@/features/dashboard/components/cards/RecentFilesCard.tsx";
import EmployeeChartCard from "@/features/dashboard/components/cards/EmployeeChartCard.tsx"
import ContentTypeChartCard from "@/features/dashboard/components/cards/ContentTypeChartCard.tsx";
import LinksCard from "@/features/dashboard/components/cards/LinksCard.tsx";
import PreviewedFilesCard from "@/features/dashboard/components/cards/PreviewedFilesCard.tsx";

const cards = [
    HelloCard,
    ClockCard,
    PreviewedFilesCard,
    EmployeeChartCard,
    ContentTypeChartCard,
    QuickLinksCard,
    BookmarkedCard,
    MyContentCard,
    RecentFilesCard,
    LinksCard,
]

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
                {cards.map((Card, index) => (
                    <Card key={index} />
                ))}
            </div>

        </>
    )
}

export default Dashboard;
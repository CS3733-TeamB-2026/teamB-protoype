import { Card } from "@/components/ui/card.tsx";
import { type WidgetSize } from "@/features/dashboard/widget-registry.ts"
import type {ReactNode} from "react";

type DashboardCardProps = {
    size: WidgetSize;
    borderColor?: string;
    children: ReactNode;
}

const sizeClasses: Record<WidgetSize, string> = {
    small: "col-span-1",
    medium: "md:col-span-2",
    full: "md:col-span-2 lg:col-span-3",
}

function DashboardCard(
    {
        size,
        borderColor,
        children
    }: DashboardCardProps
) {
    return (
        <Card className={`${borderColor ? `border-t-${borderColor} border-t-4` : ""} ${sizeClasses[size]} h-full! py-8 px-4 shadow-lg hover:scale-101 transition-transform`}>
            {children}
        </Card>
    )
}

export default DashboardCard;
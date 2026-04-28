import BookmarkedCard from "@/features/dashboard/components/cards/BookmarkedCard"
import ClockCard from "@/features/dashboard/components/cards/ClockCard"
import HelloCard from "@/features/dashboard/components/cards/HelloCard"
import MyContentCard from "@/features/dashboard/components/cards/MyContentCard.tsx";
import QuickLinksCard from "@/features/dashboard/components/cards/QuickLinksCard.tsx";
import RecentFilesCard from "@/features/dashboard/components/cards/RecentFilesCard.tsx";
import EmployeeChartCard from "@/features/dashboard/components/cards/EmployeeChartCard.tsx"
import ContentTypeChartCard from "@/features/dashboard/components/cards/ContentTypeChartCard.tsx";
import LinksCard from "@/features/dashboard/components/cards/LinksCard.tsx";
import ReportCard from "@/features/dashboard/components/cards/ReportCard.tsx";
import React from "react";

export type WidgetLayoutEntry = {
    id: WidgetId;
    visible: boolean;
    size: WidgetSize;
};

export const WIDGET_REGISTRY = {
    hello: { component: HelloCard, label: "Welcome", defaultSize: "medium", description: "Greets you on your dashboard." },
    clock: { component: ClockCard, label: "Clock", defaultSize: "small", description: "Displays current time." },
    employeeChart: { component: EmployeeChartCard, label: "Employees", defaultSize: "small", description: "Displays employee role headcounts." },
    contentTypeChart: { component: ContentTypeChartCard, label: "Content Types", defaultSize: "medium", description: "Displays content type distribution." },
    quickLinks: { component: QuickLinksCard, label: "Quick Links", defaultSize: "small", description: "Helpful links." },
    bookmarked: { component: BookmarkedCard, label: "Favorites", defaultSize: "small", description: "Shows your bookmarked files." },
    myContent: { component: MyContentCard, label: "My Content", defaultSize: "small", description: "Shows content you own." },
    recentFiles: { component: RecentFilesCard, label: "Recent Files", defaultSize: "medium", description: "Shows recent files." },
    links: { component: LinksCard, label: "Role Links", defaultSize: "small", description: "Shows role specific links." },
    reports: { component: ReportCard, label: "Reports", defaultSize: "full", description: "Shows reports and analytics" },
} satisfies Record<string, { component: React.ComponentType; label: string; defaultSize: WidgetSize; description: string }>;

export type WidgetId = keyof typeof WIDGET_REGISTRY;
export type WidgetSize = "small" | "medium" | "full";

export const DEFAULT_LAYOUT: WidgetLayoutEntry[] = (
    Object.keys(WIDGET_REGISTRY) as WidgetId[]
    ).map((id) => ({
        id,
        visible: true,
        size: WIDGET_REGISTRY[id].defaultSize,
    }));
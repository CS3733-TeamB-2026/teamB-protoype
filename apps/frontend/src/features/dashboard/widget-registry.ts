import BookmarkedCard from "@/features/dashboard/components/cards/BookmarkedCard"
import ClockCard from "@/features/dashboard/components/cards/ClockCard"
import HelloCard from "@/features/dashboard/components/cards/HelloCard"
import MyContentCard from "@/features/dashboard/components/cards/MyContentCard.tsx";
import QuickLinksCard from "@/features/dashboard/components/cards/QuickLinksCard.tsx";
import RecentFilesCard from "@/features/dashboard/components/cards/RecentFilesCard.tsx";
import EmployeeChartCard from "@/features/dashboard/components/cards/EmployeeChartCard.tsx"
import ContentTypeChartCard from "@/features/dashboard/components/cards/ContentTypeChartCard.tsx";
import LinksCard from "@/features/dashboard/components/cards/LinksCard.tsx";
import React from "react";

export type WidgetLayoutEntry = {
    id: WidgetId;
    visible: boolean;
    size: WidgetSize;
};

export const WIDGET_REGISTRY = {
    hello: { component: HelloCard, label: "Welcome", defaultSize: "medium" },
    clock: { component: ClockCard, label: "Clock", defaultSize: "small" },
    employeeChart: { component: EmployeeChartCard, label: "Employees", defaultSize: "small" },
    contentTypeChart: { component: ContentTypeChartCard, label: "Content Types", defaultSize: "medium" },
    quickLinks: { component: QuickLinksCard, label: "Quick Links", defaultSize: "small" },
    bookmarked: { component: BookmarkedCard, label: "Favorites", defaultSize: "small" },
    myContent: { component: MyContentCard, label: "My Content", defaultSize: "small" },
    recentFiles: { component: RecentFilesCard, label: "Recent Files", defaultSize: "medium" },
    links: { component: LinksCard, label: "Links", defaultSize: "small" },
} satisfies Record<string, { component: React.ComponentType; label: string; defaultSize: WidgetSize }>;

export type WidgetId = keyof typeof WIDGET_REGISTRY;
export type WidgetSize = "small" | "medium" | "full";

export const DEFAULT_LAYOUT: WidgetLayoutEntry[] = (
    Object.keys(WIDGET_REGISTRY) as WidgetId[]
    ).map((id) => ({
        id,
        visible: true,
        size: WIDGET_REGISTRY[id].defaultSize,
    }));
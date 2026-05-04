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
import ReportCard from "@/features/dashboard/components/cards/ReportCard.tsx";
import OwnedCollectionsCard from "@/features/dashboard/components/cards/OwnedCollectionsCard.tsx";
import FavoritedCollectionsCard from "@/features/dashboard/components/cards/FavoritedCollectionsCard.tsx";
import ServiceRequestsCard from "@/features/dashboard/components/cards/ServiceRequestsCard.tsx";
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
    preview: { component: PreviewedFilesCard, label: "Previewed", defaultSize: "small", description: "Shows recently viewed files." },
    collections: { component: OwnedCollectionsCard, label: "OwnedCollections", defaultSize: "medium", description: "Shows owned collections." },
    favoritedCollections: { component: FavoritedCollectionsCard, label: "FavoritedCollections", defaultSize: "medium", description: "Shows favorited collections." },
    serviceRequests: { component: ServiceRequestsCard, label: "Assigned Service Requests", defaultSize: "medium", description: "Shows service requests assigned to you." },
    reports: { component: ReportCard, label: "Reports", defaultSize: "full", description: "Shows reports and analytics." },
} satisfies Record<string, { component: React.ComponentType; label: string; defaultSize: WidgetSize; description: string }>;

export type WidgetId = keyof typeof WIDGET_REGISTRY;
export type WidgetSize = "small" | "medium" | "full";


export const DEFAULT_LAYOUT: WidgetLayoutEntry[] = [
    { id: "hello", visible: true, size: "medium" },
    { id: "clock", visible: true, size: "small" },
    { id: "employeeChart", visible: true, size: "small" },
    { id: "contentTypeChart", visible: true, size: "medium" },
    { id: "quickLinks", visible: true, size: "small" },
    { id: "bookmarked", visible: true, size: "small" },
    { id: "myContent", visible: true, size: "small" },
    { id: "favoritedCollections", visible: true, size: "small" },
    { id: "collections", visible: true, size: "small" },
    { id: "serviceRequests", visible: true, size: "small" },
    { id: "preview", visible: true, size: "full" },
    { id: "reports", visible: true, size: "full" },
    { id: "recentFiles", visible: false, size: "medium" },
    { id: "links", visible: false, size: "small" },
];
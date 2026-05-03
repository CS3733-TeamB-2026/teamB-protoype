//import { useUser } from "@/hooks/use-user.ts";
import { Hero } from "@/components/shared/Hero.tsx";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title.ts";
import { WIDGET_REGISTRY, type WidgetSize, type WidgetId } from "@/features/dashboard/widget-registry.ts";
import DashboardCustomizeSheet from "@/features/dashboard/components/DashboardCustomizeSheet.tsx";
import { useDashboardLayout } from "@/features/dashboard/use-dashboard-layout.ts";
import { useState } from "react";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";

import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

const sizeClasses: Record<WidgetSize, string> = {
    small: "col-span-1",
    medium: "md:col-span-2",
    full: "md:col-span-2 lg:col-span-3",
};

type SortableDashboardCardProps = {
    id: WidgetId;
    size: WidgetSize;
};

function SortableDashboardCard({ id, size }: SortableDashboardCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        // Only apply translate, not scale — prevents size distortion
        transform: CSS.Transform.toString(
            transform ? { ...transform, scaleX: 1, scaleY: 1 } : null
        ),
        transition,
    };

    const Card = WIDGET_REGISTRY[id].component;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${sizeClasses[size]} h-full`}
            {...attributes}
            {...listeners}
        >
            {/* Ghost placeholder while dragging — keeps grid stable */}
            {isDragging ? (
                <div className="h-full w-full rounded-xl border-2 border-dashed border-border bg-muted/40" />
            ) : (
                <div className="h-full cursor-grab active:cursor-grabbing">
                    <Card />
                </div>
            )}
        </div>
    );
}

// A plain (non-sortable) card used inside DragOverlay
function DragOverlayCard({ id }: { id: WidgetId }) {
    const Card = WIDGET_REGISTRY[id].component;
    return (
        <div className="cursor-grabbing opacity-95 shadow-2xl ring-2 ring-primary/30 rounded-xl">
            <Card />
        </div>
    );
}

function Dashboard() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    usePageTitle("Dashboard");
    //const user = useUser();

    const { layout, setLayout, isLoading } = useDashboardLayout();
    const [activeId, setActiveId] = useState<WidgetId | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as WidgetId);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        setLayout((prev) => {
            const oldIndex = prev.findIndex((widget) => widget.id === active.id);
            const newIndex = prev.findIndex((widget) => widget.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return prev;

            return arrayMove(prev, oldIndex, newIndex);
        });
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const visibleLayout = layout.filter((w) => w.visible);
    const activeWidget = activeId ? layout.find((w) => w.id === activeId) : null;

    if (isLoading) {
        return (
            <>
                <Hero icon={LayoutDashboard} description="Find all your tools here." title="Dashboard" />
                <div className="flex items-center justify-center py-32">
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
                title={ts('sidebar.dashboard')}
            />

            {/* Customize Button */}
            <div className="mx-25 mt-6 flex flex-row items-center justify-end">
                <DashboardCustomizeSheet layout={layout} setLayout={setLayout} />
            </div>

            {/* Display Cards */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext
                    items={visibleLayout.map((w) => w.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="mx-15 grid grid-cols-1 gap-6 px-8 py-4 md:grid-cols-2 lg:grid-cols-3">
                        {visibleLayout.map(({ id, size }) => (
                            <SortableDashboardCard
                                key={id}
                                id={id}
                                size={size}
                            />
                        ))}
                    </div>
                </SortableContext>

                {/* Floating drag clone — renders at cursor, outside the grid */}
                <DragOverlay dropAnimation={{
                    duration: 200,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                }}>
                    {activeId && activeWidget ? (
                        <div className={sizeClasses[activeWidget.size]}>
                            <DragOverlayCard id={activeId} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    );
}

export default Dashboard;

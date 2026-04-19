import { useLayoutEffect, useRef } from "react";
import { TabsList } from "@/components/ui/tabs";

type SlidingTabsListProps = {
    activeTab: string;
    indicatorColor?: string;
    children: React.ReactNode;
};

/**
 * A TabsList with a pill that slides between the active trigger's position.
 */
export function SlidingTabs({
                                activeTab,
                                indicatorColor = "bg-primary",
                                children,
                            }: SlidingTabsListProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const active = listRef.current?.querySelector<HTMLElement>('[data-state="active"]');
        const ind = indicatorRef.current;
        if (!active || !ind) return;
        Object.assign(ind.style, {
            left: `${active.offsetLeft}px`,
            width: `${active.offsetWidth}px`,
            opacity: "1",
        });
    }, [activeTab]);

    return (
        <TabsList ref={listRef} className="relative bg-transparent p-0 gap-4">
            <div
                ref={indicatorRef}
                className={`absolute bottom-0 h-[2px] rounded-full transition-all duration-300 ease-out opacity-0 ${indicatorColor}`}
            />
            {children}
        </TabsList>
    );
}
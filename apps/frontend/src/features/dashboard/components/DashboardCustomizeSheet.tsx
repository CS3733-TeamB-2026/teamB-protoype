import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Settings2 } from "lucide-react"
import { type WidgetLayoutEntry, type WidgetId } from "@/features/dashboard/widget-registry.ts";
import WidgetRow from "@/features/dashboard/components/WidgetRow.tsx";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type DashboardCustomizeSheetProps = {
    layout: WidgetLayoutEntry[];
    setLayout: React.Dispatch<React.SetStateAction<WidgetLayoutEntry[]>>;
}

function DashboardCustomizeSheet({ layout, setLayout }: DashboardCustomizeSheetProps) {

    const updateEntry = (id: WidgetId, updates: Partial<WidgetLayoutEntry>) => {
        setLayout(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setLayout(prev => {
            const oldIndex = prev.findIndex(w => w.id === active.id);
            const newIndex = prev.findIndex(w => w.id === over.id);
            return arrayMove(prev, oldIndex, newIndex);
        });
    };


    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Customize
                </Button>
            </SheetTrigger>
            <SheetContent className="w-200 sm:w-250 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Customize Dashboard</SheetTitle>
                    <SheetDescription>
                        Show, hide, and resize widgets on your dashboard.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={layout.map(w => w.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {layout.map((layoutEntry) => (
                                <WidgetRow
                                    key={layoutEntry.id}
                                    layoutEntry={layoutEntry}
                                    onUpdate={(updates) => updateEntry(layoutEntry.id, updates)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default DashboardCustomizeSheet;
import {WIDGET_REGISTRY, type WidgetSize, type WidgetLayoutEntry} from "@/features/dashboard/widget-registry.ts";
import {Switch} from "@/components/ui/switch.tsx";
import {Label} from "@/components/ui/label.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {useSortable} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

function WidgetRow({
   layoutEntry,
   onUpdate,
}: {
    layoutEntry: WidgetLayoutEntry;
    onUpdate: (updates: Partial<WidgetLayoutEntry>) => void;
}) {

    const meta = WIDGET_REGISTRY[layoutEntry.id];

    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: layoutEntry.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-6 ml-6 mr-6">
            <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex flex-row items-center justify-between gap-4">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
                        aria-label="Drag to reorder"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <Switch
                        id={`vis-${layoutEntry.id}`}
                        checked={layoutEntry.visible}
                        onCheckedChange={(checked) => {
                            onUpdate({ visible: checked })
                        }}
                    />
                    <div className="flex flex-col">
                        <Label htmlFor={`vis-${layoutEntry.id}`} className="capitalize text-lg">
                            {meta.label}
                        </Label>
                        <Label htmlFor={`vis-${layoutEntry.id}`} className="text-md text-muted-foreground">
                            {meta.description}
                        </Label>
                    </div>
                </div>
            </div>
            <RadioGroup
                className="px-5 mr-3 mt-2 flex flex-row justify-between items-center"
                value={layoutEntry.size}
                onValueChange={(value) =>
                    onUpdate({ size: value as WidgetSize })
                }
            >
                {(["small", "medium", "full"] as WidgetSize[]).map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                        <RadioGroupItem value={size} id={`${layoutEntry.id}-${size}`} className="border-primary" />
                        <Label htmlFor={`${layoutEntry.id}-${size}`} className="capitalize text-sm">
                            {size}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    )
}

export default WidgetRow;
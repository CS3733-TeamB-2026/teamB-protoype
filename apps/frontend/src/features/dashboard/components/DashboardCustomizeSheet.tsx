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
import { WIDGET_REGISTRY, type WidgetId, type WidgetLayoutEntry, type WidgetSize, DEFAULT_LAYOUT } from "@/features/dashboard/widget-registry.ts";
import {Separator} from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type DashboardCustomizeSheetProps = {
    layout: WidgetLayoutEntry[];
    setLayout: React.Dispatch<React.SetStateAction<WidgetLayoutEntry[]>>;
}

function DashboardCustomizeSheet({ layout, setLayout }: DashboardCustomizeSheetProps) {

    const layoutMap = new Map(layout.map(w => [w.id, w]));

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
                    {
                        Object.entries(WIDGET_REGISTRY)
                            .map(([widget, entry]) => (
                                <div key={widget} className="my-3 mx-6">
                                    <div className="flex flex-row items-center justify-between gap-4">
                                        <div className="flex flex-row items-center justify-between gap-4">
                                            <Switch
                                                id={`vis-${widget}`}
                                                checked={ layoutMap.has(widget as WidgetId) ? layoutMap.get(widget as WidgetId)?.visible : false }
                                                onCheckedChange={ (checked) => {
                                                    setLayout(prev =>
                                                        prev.map( w => w.id === widget ? {...w, visible: checked} : w )
                                                    )
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <Label htmlFor={`vis-${widget}`} className="capitalize text-lg">{entry.label}</Label>
                                                <Label htmlFor={`vis-${widget}`} className="text-md text-muted-foreground">{entry.description}</Label>
                                            </div>
                                        </div>
                                        <div className="flex flex-row justify-center items-center">
                                            <RadioGroup
                                                className="gap-1 mr-3"
                                                value={ layoutMap.get(widget as WidgetId)?.size }
                                                onValueChange={(value) =>
                                                    setLayout(prev =>
                                                        prev.map( w => w.id === widget ? {...w, size: value as WidgetSize} : w )
                                                    )
                                                }
                                            >
                                                {
                                                    (["small","medium","full"] as WidgetSize[]).map((size) => (
                                                        <div key={size} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={size} id={`${widget}-${size}`} />
                                                            <Label htmlFor={`${widget}-${size}`} className="capitalize text-md">{size}</Label>
                                                        </div>
                                                    ))
                                                }
                                            </RadioGroup>
                                        </div>

                                    </div>
                                </div>
                            ))
                    }
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default DashboardCustomizeSheet;
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Settings2 } from "lucide-react";
import { type WidgetLayoutEntry, type WidgetId, DEFAULT_LAYOUT } from "@/features/dashboard/widget-registry.ts";
import WidgetRow from "@/features/dashboard/components/WidgetRow.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

type DashboardCustomizeSheetProps = {
    layout: WidgetLayoutEntry[];
    setLayout: React.Dispatch<React.SetStateAction<WidgetLayoutEntry[]>>;
};

function DashboardCustomizeSheet({ layout, setLayout }: DashboardCustomizeSheetProps) {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    const updateEntry = (id: WidgetId, updates: Partial<WidgetLayoutEntry>) => {
        setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    };

    return (
        <Sheet modal={false}>
            <SheetTrigger asChild>
                <Button className="bg-accent-dark hover:bg-accent-dark/80 active:scale-97">
                    <Settings2 className="mr-2 h-4 w-4" />
                    {ts('customize')}
                </Button>
            </SheetTrigger>

            <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <SheetHeader className="border-b px-6 py-5 text-left">
                    <SheetTitle className="text-3xl font-bold tracking-tight text-primary">
                        {ts('customize.title')}
                    </SheetTitle>
                    <SheetDescription className="text-base text-muted-foreground">
                        {ts('customize.subtitle')}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="space-y-3">
                        {layout.map((layoutEntry) => (
                            <WidgetRow
                                key={layoutEntry.id}
                                layoutEntry={layoutEntry}
                                onUpdate={(updates) => updateEntry(layoutEntry.id, updates)}
                            />
                        ))}
                    </div>
                </div>

                <SheetFooter className="border-t bg-background px-6 py-4">
                    <div className="flex w-full justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setLayout(DEFAULT_LAYOUT);
                            }}
                        >
                            Reset to Default
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default DashboardCustomizeSheet;
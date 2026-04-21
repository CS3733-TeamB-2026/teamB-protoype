import { cn } from "@/lib/utils"
import type {ReactNode} from "react";

type SettingSectionProps = {
    title: string,
    description?: string,
    children: ReactNode,
    className?: string,
};

function SettingsSection({
    title,
    description,
    children,
    className,
    }: SettingSectionProps) {

    return (
        <section className={cn("space-y-6", className)}>
            <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-primary">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

export default SettingsSection;
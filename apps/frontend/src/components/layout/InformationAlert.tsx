import { Info } from "lucide-react";
import React from "react";

interface InfoButtonProps {
    content: React.ReactNode;
}

function InfoButton({ content }: InfoButtonProps) {
    const [hovered, setHovered] = React.useState(false);

    return (
        <div className="relative flex items-center">
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="relative"
            >
                <Info className={`w-7 h-7 cursor-pointer duration-200 ${hovered ? "text-accent" : "opacity-20"}`} />

                {hovered && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 rounded-lg border border-border bg-card shadow-lg p-3 text-xs text-muted-foreground">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-l border-t border-border" />
                        {content}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InfoButton;
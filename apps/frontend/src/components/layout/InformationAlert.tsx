import { CircleQuestionMark } from "lucide-react";
import React from "react";

interface InfoButtonProps {
    content: React.ReactNode;
    size?: string;
}

function InfoButton({ content, size = "w-7 h-7" }: InfoButtonProps) {
    const [hovered, setHovered] = React.useState(false);
    const [offset, setOffset] = React.useState(0);

    //this is so it doesn't go off the screen
    const popupRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (hovered && popupRef.current) {
            const rect = popupRef.current.getBoundingClientRect();
            const padding = 8;

            if (rect.right > window.innerWidth - padding) {
                setOffset(window.innerWidth - padding - rect.right);
            } else if (rect.left < padding) {
                setOffset(padding - rect.left);
            } else {
                setOffset(0);
            }
        }
    }, [hovered]);

    return (
        <div className="relative flex items-center">
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false); setOffset(0); }}
                className="relative"
            >
                <CircleQuestionMark className={`${size} cursor-pointer duration-200 ${hovered ? "text-accent" : "opacity-10"}`} />

                {hovered && (
                    <div
                        ref={popupRef}
                        style={{ transform: `translateX(calc(-50% + ${offset}px))` }}
                        className="absolute left-1/2 top-full mt-2 z-50 w-72 rounded-lg border border-border bg-card shadow-lg p-3 text-xs text-muted-foreground"
                    >
                        <div
                            style={{ marginLeft: `${-offset}px` }}
                            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-l border-t border-border"
                        />
                        {content}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InfoButton;
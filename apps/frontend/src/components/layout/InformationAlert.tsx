import { CircleQuestionMark } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";

interface InfoButtonProps {
    content: React.ReactNode;
    size?: string;
}

function InfoButton({ content, size = "w-7 h-7" }: InfoButtonProps) {
    const [hovered, setHovered] = React.useState(false);

    //had to make things work through a portal because the cards were cutting off.
    //portals just render on top of the heirarchy
    const popupRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const [popupStyle, setPopupStyle] = React.useState<React.CSSProperties>({});

    React.useEffect(() => {
        if (hovered && triggerRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const padding = 8;
            const popUpWidth = 288; //equivalent to w-72

            const left = triggerRect.left + triggerRect.width / 2 - popUpWidth / 2;
            const top = triggerRect.bottom + 4;

            const maxLeft = window.innerWidth - popUpWidth - padding;
            const clampedLeft = Math.max(padding, Math.min(left, maxLeft));

            setPopupStyle({
                position: "fixed",
                top: top,
                left: clampedLeft,
                width: popUpWidth,
                zIndex: 9999,
            });
        }
    }, [hovered]);

    const popup = hovered && createPortal(
        <div
            ref={popupRef}
            style={popupStyle}
            className="rounded-lg border border-border bg-card shadow-lg p-3 text-xs text-muted-foreground"
        >
            {content}
        </div>,
        document.body
    );

    return (
        <div className="relative flex items-center">
            <div
                ref={triggerRef}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => { setHovered(false);}}
                className="relative"
            >
                <CircleQuestionMark className={`${size} cursor-pointer ${hovered ? "text-accent" : "opacity-30"}`} />
            </div>
            {popup}
        </div>
    );
}

export default InfoButton;
import { AlertTriangle } from "lucide-react";
import React, {useEffect} from "react";
import { useLocation } from "react-router-dom";

function DisclaimerAlert() {

    const [open, setOpen] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const hasShownAlert = React.useRef(false);
    const location = useLocation();

    useEffect( () => {
        console.log("DisclaimerAlert");
        const timer = setTimeout(() => {
            if (location.pathname == "/" && !hasShownAlert.current) {
                console.log("DisclaimerAlert2");
                hasShownAlert.current = true;
                setTimeout(() => setOpen(true), 500);
                setTimeout(() => setOpen(false), 4000);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className="relative flex items-center">
            <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                 className={`absolute flex items-center overflow-hidden transition-all duration-600 ease-in-out ${ open || hovered ? "text-secondary" : "text-secondary/25"}`}
                 style={{maxWidth: open || hovered ? '800px' : '40px'}}
                 onClick={() => { hasShownAlert.current = false }}
            >
                <AlertTriangle className={`w-8! h-8! shrink-0 ${ open || hovered ? "text-destructive" : "text-secondary/15"} transition-colors`}/>
                <span className="ml-2 w-100 shrink-0 text-xs"><b>Disclaimer:</b> This website has been created for WPI’s CS 3733 Software Engineering as a class project and is not in use by Hanover Insurance.</span>
            </div>
        </div>
    )
}

export default DisclaimerAlert;
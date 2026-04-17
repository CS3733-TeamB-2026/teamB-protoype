import { Info } from "lucide-react";
import React, {useEffect} from "react";
import { useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function DisclaimerAlert() {

    const [open, setOpen] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const hasShownAlert = React.useRef(false);
    const location = useLocation();
    const {isAuthenticated} = useAuth0();

    useEffect( () => {
        console.log("DisclaimerAlert");
        const timer = setTimeout(() => {
            if (location.pathname == "/" && !hasShownAlert.current && !isAuthenticated) {
                console.log("DisclaimerAlert2");
                hasShownAlert.current = true;
                setTimeout(() => setOpen(true), 1000);
                setTimeout(() => setOpen(false), 6000);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [isAuthenticated, location.pathname]);

    return (
        <div className="relative flex items-center">
            <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                 className={`absolute flex items-center overflow-hidden transition-all duration-900 ease-in-out ${ open || hovered ? "text-primary-foreground" : "text-primary-foreground/25"}`}
                 style={{maxWidth: open || hovered ? '800px' : '35px'}}
                 onClick={() => { document.documentElement.classList.toggle('dark'); }}
            >
                <Info className={`transition-colors duration-200 w-8! h-8! shrink-0 ${ open || hovered ? "text-accent" : "text-primary-foreground/15"}`}/>
                <span className="ml-2 w-100 shrink-0 text-xs">
                    <span className={`font-bold transition-colors duration-800 ${open || hovered ? "text-accent" : "text-primary-foreground/15"}`}>Disclaimer:</span> This website has been created for WPI’s CS 3733 Software Engineering as a class project and is <span className={`font-bold transition-colors duration-800 ${open || hovered ? "text-accent" : "text-primary-foreground/15"}`}>not in use by Hanover Insurance.</span></span>
            </div>
        </div>
    )
}

export default DisclaimerAlert;
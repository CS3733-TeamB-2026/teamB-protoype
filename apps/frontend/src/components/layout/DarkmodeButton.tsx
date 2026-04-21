import {Sun, Moon} from "lucide-react";
import {useState} from "react";

function DarkmodeButton() {

    const [isDark, setDark] = useState(false);

    const handleClick = () => {
        document.documentElement.classList.toggle("dark");
        setDark(!isDark);
    }

    const IconComponent = isDark ? Moon : Sun;

    return (
        <div className="relative flex items-center mr-8">
            <div className={`absolute flex items-center`}
                 onClick={handleClick}
            >
                <IconComponent />
            </div>
        </div>
    )
}

export default DarkmodeButton;
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils.ts"
import { User, Palette, Lock, Bell } from "lucide-react";

const items = [
    { to: "profile", label: "Profile", icon: User  },
    { to: "account", label: "Account", icon: Lock, disabled: true },
    { to: "appearance", label: "Appearance", icon: Palette },
    { to: "notifications", label: "Notifications", icon: Bell, disabled: true },
]

function SettingsNav() {
    return (
        <nav className="flex flex-col gap-1">
            {items.map(({ to, label, icon: Icon, disabled }) => (
                <NavLink
                    key={to}
                    to={ disabled ? "profile" : to}
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                            "hover:bg-accent-dark/80 hover:text-primary-foreground",
                            isActive && "bg-accent/80 text-primary-foreground font-medium",
                            disabled && "text-muted-foreground/50 hover:bg-muted/15 hover:text-muted-foreground/50 bg-primary/0",
                        )
                    }
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </NavLink>
            ))}
        </nav>
    );
}

export default SettingsNav;
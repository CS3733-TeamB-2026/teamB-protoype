/*import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from "@/components/ui/navigation-menu.tsx";
import {Link} from "react-router-dom";
 */

import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import logo from "../assets/hanover_logo.svg"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import LoginDialog from "@/components/LoginDialog"


function Navbar() {

    const { toggleSidebar } = useSidebar();
    const [loginOpen, setLoginOpen] = React.useState(false);

    return (
        <>

            <nav className="flex items-center bg-primary text-primary-foreground p-4 w-full shrink-0">

                <div className="flex items-center gap-2 min-w-fit z-10">
                    {/* Sidebar Trigger */}
                    <button onClick={toggleSidebar} className="cursor-pointer active:scale-[0.96] shrink-0 hover:text-muted-foreground hover:bg-secondary rounded-lg px-2 py-2 transition-colors text-xl flex items-center gap-3">
                        <Menu size={28} />
                        <span className="text-xl font-semibold">Menu</span>
                    </button>

                    <hr className="h-8 w-px bg-primary-foreground border-none ml-1" />

                    <img src={logo} alt="logo" className="shrink-0 h-10 w-auto brightness-0 invert mx-3" />
                </div>

                <div className="flex-1" />

                {/* User Avatar/Dropdown */}

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="rounded-full">
                            <Avatar className="cursor-pointer w-10 h-10 hover:scale-[1.03] active:scale-[0.96]">
                                <AvatarFallback className="bg-secondary text-primary">USR</AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault();
                            setTimeout(() => setLoginOpen(true), 50);
                        }}>
                            Log In
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Login Dialog*/}

                <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

                {/* Testing having sidebar only, leaving navbar code for potential future use

                <NavigationMenu className="max-w-full">
                    <NavigationMenuList className="gap-4">
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/"
                                className="hover:text-muted-foreground transition-colors text-xl"
                            >Home</NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/employeeform"
                                className="hover:text-muted-foreground transition-colors text-xl"
                            >Employee Form</NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/manageform"
                                className="hover:text-muted-foreground transition-colors text-xl"
                            >Management Form</NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem className="relative">

                            <DropdownMenu>
                                <DropdownMenuTrigger className="hover:text-muted-foreground hover:bg-secondary rounded-lg px-4 py-2 transition-colors text-xl">
                                    Personas
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-48 bg-primary text-primary-foreground border-none shadow-lg ">
                                    <DropdownMenuItem asChild className="text-md">
                                        <Link to="/underwriter">Underwriter</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="text-md">
                                        <Link to="/businessanalyst">Business Analyst</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                */}
            </nav>

        </>
    )
}
export default Navbar;
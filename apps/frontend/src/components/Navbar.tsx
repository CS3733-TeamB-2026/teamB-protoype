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
    const [user, setUser] = React.useState(() => {
        return JSON.parse(localStorage.getItem("user") || "null");
    })

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
                        <button className="rounded-full flex items-center gap-2 hover:underline hover:scale-[1.03] active:scale-[0.96]">
                            { !user && <span className="font-semibold">Log In</span>}
                            <Avatar className="cursor-pointer w-10 h-10 ">
                                <AvatarFallback className="bg-secondary text-primary">{user ? user.firstName[0] + user.lastName[0] : "?"}</AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {
                            //Check if logged in
                            user ?
                                //User is logged in
                                <DropdownMenuItem onSelect={() => {
                                    localStorage.removeItem("user");
                                    setUser(null);
                                }}>
                                    Log Out
                                </DropdownMenuItem>
                                :
                                //User is not logged in
                                <DropdownMenuItem onSelect={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => setLoginOpen(true), 50); //Timeout b/c object destroys too fast to open dialog
                                }}>
                                    Log In
                                </DropdownMenuItem>
                        }
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Login Dialog*/}

                <LoginDialog
                    open={loginOpen}
                    onOpenChange={setLoginOpen}
                    onLogin={(user) => setUser(user)}
                />


            </nav>

        </>
    )
}
export default Navbar;
import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import logo from "../assets/hanover_logo.svg"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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
                    <button onClick={toggleSidebar} className="cursor-pointer active:scale-[0.96] shrink-0 px-2 py-2 text-xl flex items-center gap-3 transition-all duration-200 hover:opacity-80">
                        <Menu size={28} />
                        <span className="text-xl font-semibold hover:underline underline-offset-4">Menu</span>
                    </button>

                    <hr className="h-8 w-px bg-primary-foreground border-none ml-1" />

                    <img src={logo} alt="logo" className="shrink-0 h-10 w-auto brightness-0 invert mx-3" />
                </div>

                <div className="flex-1" />

                {/* User Avatar/Dropdown Popover */}

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="rounded-full flex items-center gap-2 hover:underline hover:scale-[1.03] active:scale-[0.96]">
                            { !user && <span className="font-semibold">Log In</span>}
                            <Avatar className="cursor-pointer w-10 h-10 ">
                                <AvatarFallback className="bg-secondary text-primary">{user ? user.firstName[0] + user.lastName[0] : "?"}</AvatarFallback>
                            </Avatar>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60">
                        {
                            //Check if logged in
                            user ?
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="cursor-pointer w-10 h-10 ">
                                            <AvatarFallback className="bg-primary text-primary-foreground">{user.firstName[0] + user.lastName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-lg">{user.firstName} {user.lastName}</p>
                                            <p className="text-muted-foreground text-md capitalize">{user.persona}</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-primary" />
                                    <button className="w-full active:scale-97 bg-secondary rounded-lg px-2 py-2 transition-colors hover:bg-primary hover:text-primary-foreground" onClick={() => {
                                        localStorage.removeItem("user");
                                        setUser(null);
                                    }}>
                                        Log Out
                                    </button>
                                </div>
                            :
                                //User is not logged in
                                <button className="w-full active:scale-97 bg-secondary rounded-lg px-2 py-2 transition-colors hover:bg-primary hover:text-primary-foreground" onClick={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => setLoginOpen(true), 50); //Timeout b/c object destroys too fast to open dialog
                                }}>
                                    Log In
                                </button>
                        }
                    </PopoverContent>
                </Popover>

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
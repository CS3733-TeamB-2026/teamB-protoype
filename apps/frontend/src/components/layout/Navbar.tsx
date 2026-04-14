//import React from "react";
import { useSidebar } from "@/components/ui/sidebar.tsx";
import { Menu, Loader2 } from "lucide-react";
import logo from "../../assets/hanover_logo.svg"
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover.tsx"
import { Separator } from "@/components/ui/separator.tsx"
//import LoginDialog from "@/dialogs/LoginDialog.tsx"
import { User as UserIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { useUser } from "@/hooks/use-user.ts"


function Navbar() {

    const { toggleSidebar } = useSidebar();
    //const [loginOpen, setLoginOpen] = React.useState(false);
    //const [user, setUser] = useUser();

    const { isAuthenticated, loginWithRedirect, logout, user: auth0User } = useAuth0();

    const user = useUser();

    return (
        <>
            {/* header */}
            <nav className="flex items-center bg-primary text-primary-foreground p-4 w-full shrink-0 sticky top-0 z-50"
                 style={{ background: "linear-gradient(to right, var(--primary-dark), var(--primary), #2E6AA3)" }}>
                <div className="flex items-center gap-2 min-w-fit z-10">
                    {/* AppSidebar dropdown */}
                    <button onClick={toggleSidebar} className="group cursor-pointer active:scale-[0.96] shrink-0 px-2 py-2 text-xl flex items-center gap-3 transition-all duration-200 hover:opacity-80">
                        <Menu size={28} />
                        <span className="text-xl font-semibold relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all group-hover:after:w-full group-hover:after:opacity-80">Menu</span>
                    </button>
                    <hr className="h-8 w-px bg-primary-foreground border-none ml-1" />

                    <Link to="/">
                        <img src={logo} alt="logo" className="shrink-0 h-10 w-auto brightness-0 invert mx-3" />
                    </Link>
                </div>

                <div className="flex-1" />

                {/* user avatar popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        {
                            isAuthenticated && !user ?
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                                </div>
                                :
                                <button className="rounded-full flex items-center gap-2 hover:opacity-80 active:scale-[0.96] group cursor-pointer">
                                    <span className="text-xl font-semibold relative after:absolute after:bottom-0 after:right-0 after:h-0.5 after:w-0 after:bg-current after:transition-all group-hover:after:w-full group-hover:after:opacity-80 ">
                                        { isAuthenticated ? user?.firstName + " " + user?.lastName : "Log In"}
                                    </span>
                                    <Avatar className="cursor-pointer w-10 h-10 ">
                                        <AvatarFallback className="bg-secondary text-primary">{isAuthenticated ? " " + user?.firstName[0] + user?.lastName[0] : <UserIcon />}</AvatarFallback>
                                    </Avatar>
                                </button>


                        }

                    </PopoverTrigger>
                    <PopoverContent className="w-60">
                        {
                            //login check
                            isAuthenticated ?
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="cursor-pointer w-10 h-10 ">
                                            <AvatarFallback className="bg-primary text-primary-foreground">{auth0User?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-lg">{user?.firstName + " " + user?.lastName}</p>
                                            <p className="text-muted-foreground text-md capitalize">{user?.persona}</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-primary" />
                                    {/*log out button*/}
                                    <button className="w-full active:scale-97 bg-secondary rounded-lg px-2 py-2 transition-colors hover:bg-primary hover:text-primary-foreground" onClick={() => {
                                        logout({ logoutParams: { returnTo: window.location.origin } })
                                    }}>
                                        Log Out
                                    </button>
                                </div>
                            :
                                //User is not logged in
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-semibold text-lg">Welcome, Guest!</p>
                                            <p className="text-muted-foreground text-md capitalize">Please login below.</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-primary" />
                                    <button className="w-full active:scale-97 bg-secondary rounded-lg px-2 py-2 transition-colors hover:bg-primary hover:text-primary-foreground" onClick={() => {
                                        loginWithRedirect({
                                            appState: { returnTo: '/employeehome' }
                                        })
                                    }}>
                                        Log In
                                    </button>
                                </div>
                        }
                    </PopoverContent>
                </Popover>

                {/* login dialog
                <LoginDialog
                    open={loginOpen}
                    onOpenChange={setLoginOpen}
                    onLogin={(user) => setUser(user)}
                />*/}
            </nav>
        </>
    )
}
export default Navbar;
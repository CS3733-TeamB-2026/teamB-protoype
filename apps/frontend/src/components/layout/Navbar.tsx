import React from "react";
import { useSidebar } from "@/components/ui/sidebar.tsx";
import logo from "../../assets/hanover_logo.svg"
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover.tsx"
import { Separator } from "@/components/ui/separator.tsx"
import LoginDialog from "@/dialogs/LoginDialog.tsx"
import { User, Settings, Menu } from "lucide-react"
import { Link } from "react-router-dom"
import { useUser } from "@/hooks/use-user.ts"
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

const LOCALES = [
    { code: "en_us", label: "English" },
    { code: "sp_sp", label: "Español" },
] as const;

function Navbar() {
    const { toggleSidebar } = useSidebar();
    const [loginOpen, setLoginOpen] = React.useState(false);
    const [user, setUser] = useUser();
    const { locale, setLocale } = useLocale();
    const { ts } = useTranslation(locale);

    return (
        <>
            {/* header */}
            <nav className="flex items-center bg-primary text-primary-foreground p-4 w-full shrink-0 sticky top-0 z-50">
                <div className="flex items-center gap-4 min-w-fit z-10">
                    {/* AppSidebar dropdown */}
                    <button onClick={toggleSidebar} className="group cursor-pointer active:scale-[0.96] shrink-0 px-2 py-2 text-xl flex items-center gap-3 transition-all duration-200 hover:opacity-80">
                        <Menu size={28} />
                        <span className="text-xl font-semibold relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all group-hover:after:w-full group-hover:after:opacity-80">{ts('nav.menu')}</span>
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
                        <button className="rounded-full flex items-center gap-2 hover:opacity-80 active:scale-[0.96] group">
                            <span className="text-xl font-semibold relative after:absolute after:bottom-0 after:right-0 after:h-0.5 after:w-0 after:bg-current after:transition-all group-hover:after:w-full group-hover:after:opacity-80 ">
                                { user ? user.firstName + " " + user.lastName : "Log In"}
                            </span>
                            <Avatar className="cursor-pointer w-10 h-10 ">
                                <AvatarFallback className="bg-secondary text-primary">{user ? user.firstName[0] + user.lastName[0] : <User />}</AvatarFallback>
                            </Avatar>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60">
                        {
                            //login check
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
                                    {/*log out button*/}
                                    <button className="w-full active:scale-97 bg-secondary rounded-lg px-2 py-2 transition-colors hover:bg-primary hover:text-primary-foreground" onClick={() => {
                                        localStorage.removeItem("user");
                                        setUser(null);
                                        window.location.href = "/";
                                    }}>
                                        {ts('nav.logOut')}
                                    </button>
                                </div>
                            :
                                //User is not logged in
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-semibold text-lg">{ts("nav.guestWelcome")}</p>
                                            <p className="text-muted-foreground text-md capitalize">{ts("nav.pleaseLogin")}</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-primary" />
                                    <button className="w-full active:scale-97 bg-secondary rounded-lg px-2 py-2 transition-colors hover:bg-primary hover:text-primary-foreground" onClick={(e) => {
                                        e.preventDefault();
                                        setTimeout(() => setLoginOpen(true), 50); //Timeout b/c object destroys too fast to open dialog
                                    }}>
                                        {ts('nav.login')}
                                    </button>
                                </div>
                        }
                    </PopoverContent>
                </Popover>

                {/*settings*/}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="group cursor-pointer p-2 px-6 rounded-full active:scale-[0.96] transition-all duration-200">
                            <Settings
                                size={22}
                                className="opacity-70 transition-all duration-200 group-hover:opacity-100"
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                        <p className="font-semibold text-sm text-center">{ts('settings.language')}</p>
                        <Separator className="" />
                        <div className="flex flex-col gap-1">
                            {LOCALES.map(({ code, label }) => (
                                <button
                                    key={code}
                                    onClick={() => setLocale(code)}
                                    className={`w-full text-center px-3 py-2 rounded-lg text-sm transition-colors
                      ${locale === code
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-secondary"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* login dialog */}
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
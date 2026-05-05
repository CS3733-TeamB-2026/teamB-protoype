import { useSidebar } from "@/components/ui/sidebar.tsx";
import {Menu, Loader2, Search} from "lucide-react";
import logo from "../../assets/hanover_logo.svg"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover.tsx"
import { Separator } from "@/components/ui/separator.tsx"
//import LoginDialog from "@/dialogs/LoginDialog.tsx"
import { UserIcon, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { useUser } from "@/hooks/use-user.ts"
import { useAvatarUrl } from "@/hooks/use-avatar-url"
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";
import DisclaimerAlert from "@/components/layout/DisclaimerAlert"
import {useState} from "react";
//import React from "react";
import { NotificationBell } from "@/features/notifications/NotificationBell.tsx";
//import InfoButton from "@/components/layout/InformationAlert.tsx";


/*const LOCALES = [
    { code: "en_us", label: "English" },
    { code: "sp_sp", label: "Español" },
] as const;*/

//type SettingsCategory = "language" | "theme" | null;

/** Compact search bar shown in the navbar center; hidden on the /search page itself and when logged out. */
function NavSearchBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth0();
    const [q, setQ] = useState("");

    if (!isAuthenticated || location.pathname === "/search") return null;

    const submit = () => {
        if (!q.trim()) return;
        window.localStorage.setItem("query", q);
        navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    };

    return (
        <div className="flex items-center gap-1 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-3 py-1 w-72 focus-within:bg-primary-foreground/15 transition-colors">
            <Search size={16} className="text-primary-foreground/60 shrink-0" />
            <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Global search..."
                className="bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 text-sm outline-none flex-1 min-w-0"
            />
        </div>
    );
}

function Navbar() {
    const { toggleSidebar } = useSidebar();
    //const [loginOpen, setLoginOpen] = React.useState(false);
    //const [user, setUser] = useUser();
    const [userOpen, setUserOpen] = useState(false);

    const navigate = useNavigate();

    const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

    const {user} = useUser();
    const avatarUrl = useAvatarUrl(user?.id, user?.profilePhotoURI);
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    //const [openCategory, setOpenCategory] = React.useState<SettingsCategory>(null);
    //const toggleCategory = (cat: SettingsCategory) =>
    //    setOpenCategory(prev => (prev === cat ? null : cat));

    return (
        <>
            {/* header */}
            <nav className="shadow-xl flex items-center bg-primary text-primary-foreground p-4 w-full shrink-0 sticky top-0 z-50 relative"
                 style={{ background: "linear-gradient(to right, var(--primary-surface-dark) 25%, var(--primary-surface), var(--primary-surface-light)" }}>
                <div className="flex items-center gap-4 min-w-fit z-10">
                    {/* AppSidebar dropdown */}
                    <button onClick={toggleSidebar} className="group cursor-pointer active:scale-[0.96] shrink-0 px-2 py-2 text-xl flex items-center gap-3 transition-all duration-200 hover:opacity-80">
                        <Menu size={28} />
                        <span className="text-xl font-semibold relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all group-hover:after:w-full group-hover:after:opacity-80">{ts('nav.menu')}</span>
                    </button>

                    <hr className="h-8 w-px bg-primary-foreground border-none ml-1" />

                    <Link to="/">
                        <img src={logo} alt="logo" className="shrink-0 h-10 w-auto brightness-0 invert ml-3 mr-2" />
                    </Link>

                    <DisclaimerAlert />
                </div>

                <div className="flex-1" />

                {/* search bar — hidden on the /search page */}
                <div>
                    <NavSearchBar />
                </div>

                {/* user avatar popover */}
                {isAuthenticated && <NotificationBell />}
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                    <PopoverTrigger className="ml-3 mr-1" asChild>
                        {
                            isAuthenticated && !user ?
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                                </div>
                                :
                                <button className="rounded-full flex items-center gap-2 hover:opacity-80 active:scale-[0.96] group cursor-pointer">
                                    <span className="text-xl font-semibold relative after:absolute after:bottom-0 after:right-0 after:h-0.5 after:w-0 after:bg-current after:transition-all group-hover:after:w-full group-hover:after:opacity-80 ">
                                        { isAuthenticated ? user?.firstName + " " + user?.lastName : ts('nav.login')}
                                    </span>
                                    <Avatar className="cursor-pointer w-10 h-10 ">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="bg-accent text-primary-foreground">{isAuthenticated ? `${user?.firstName[0]}${user?.lastName[0]}` : <UserIcon />}</AvatarFallback>
                                    </Avatar>
                                </button>
                        }

                    </PopoverTrigger>
                    <PopoverContent className="w-65 mr-2">
                        {
                            //login check
                            isAuthenticated ?
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="cursor-pointer w-10 h-10 ">
                                            <AvatarImage src={avatarUrl} />
                                            <AvatarFallback className="bg-accent text-primary-foreground">{isAuthenticated ? `${user?.firstName[0]}${user?.lastName[0]}` : <UserIcon />}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-lg text-primary">{user?.firstName + " " + user?.lastName}</p>
                                            <p className="text-muted-foreground text-md capitalize">{user?.persona}</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-primary" />
                                    {/*log out button*/}
                                    <div className="flex flex-row items-center gap-3 mx-1">
                                        <button
                                            className="active:scale-97 bg-secondary rounded-full px-2 py-2 transition-colors hover:bg-accent hover:text-primary-foreground"
                                            onClick={() => {
                                                navigate("/settings");
                                                setUserOpen(false);
                                            }}
                                        >
                                            <Settings />
                                        </button>
                                        <button
                                            className="active:scale-97 bg-secondary rounded-full px-2 py-2 transition-colors hover:bg-accent hover:text-primary-foreground"
                                            onClick={() => {
                                                navigate("/employeehome");
                                                setUserOpen(false);
                                            }}
                                        >
                                            <LayoutDashboard />
                                        </button>
                                        <button className=" text-sm w-full active:scale-97 bg-secondary font-semibold rounded-full h-10 px-2 py-2 transition-colors hover:bg-accent hover:text-primary-foreground" onClick={() => {
                                            logout({ logoutParams: { returnTo: window.location.origin } })
                                        }}>
                                            <div className="flex flex-row items-center justify-center gap-2">
                                                {ts('nav.logOut')}
                                                <LogOut className="w-5 h-5" />
                                            </div>

                                        </button>
                                    </div>
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
                                    <button className="w-full active:scale-97 bg-secondary rounded-lg px-2 py-2 transition-colors hover:bg-accent hover:text-primary-foreground" onClick={() => {
                                        loginWithRedirect({
                                            appState: { returnTo: '/employeehome' }
                                        })
                                    }}>
                                        {ts('nav.login')}
                                    </button>
                                </div>
                        }
                    </PopoverContent>
                </Popover>

                {/*settings*/}
                {/* only allows one category to be open at a time */}
                {/*<Popover onOpenChange={(open) => { if (!open) setOpenCategory(null); }}>
                    <PopoverTrigger asChild>
                        <button className="group cursor-pointer p-2 ml-3 rounded-full active:scale-[0.96] transition-all duration-200">
                            <Languages
                                size={28}
                                className="opacity-70 transition-all duration-200 group-hover:opacity-100"
                            />
                        </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-52 p-2">
                        <div className="flex flex-col gap-1">

                            <button
                                onClick={() => toggleCategory("language")}
                                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-secondary"
                            >
                                <span className="flex items-center gap-1">
                                    {ts('settings.language')}
                                    <InfoButton content={ts('notFullySupported')} size={"w-5 h-5"}/>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${openCategory === "language" ? "rotate-180" : ""}`}
                                />
                            </button>

                            {openCategory === "language" && (
                                <div className="flex flex-col gap-0.5 pl-3 pb-1">
                                    {LOCALES.map(({ code, label }) => (
                                        <button
                                            key={code}
                                            onClick={() => setLocale(code)}
                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors
                                                ${locale === code
                                                ? "bg-accent text-primary-foreground"
                                                : "hover:bg-secondary"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}

                        </div>
                    </PopoverContent>
                </Popover>*/}

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
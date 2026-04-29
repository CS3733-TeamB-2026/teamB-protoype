import { FileText, HelpCircle, Home, User, ChevronDown, Users, X, Library, LayoutDashboard, Upload, NetworkIcon, CalendarClock, Search, BookMarked } from "lucide-react"
import React from "react"
import {Link} from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar.tsx"
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible.tsx"
import { Button } from "@/components/ui/button.tsx"
import { useUser } from "@/hooks/use-user.ts"
import type {TranslationKey} from "@/languageSupport/keys.ts";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

type NavItem = {
    title: string;
    icon: React.ComponentType;
    href: string;
    children: NavItem[];
    access: string[];
    langKey?: TranslationKey;
}

/*
Add pages here, icons imported from lucide react
For dropdowns, add more items in children array, leave the array empty for single items
 */
const navItems: NavItem[] = [
    { title: "Home", icon: Home, href: "/", children: [], access: [], langKey: 'sidebar.home' },
    { title: "Dashboard", icon: LayoutDashboard, href: "/employeehome", children: [], access: ["admin", "underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps"], langKey: 'sidebar.dashboard' },
    { title: "Content Library", icon: Library, href: "/files", children: [], access: ["admin", "underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps"], langKey: 'sidebar.manageContent' },
    { title: "Bulk Upload", icon: Upload, href: "/files/bulk", children: [], access: ["admin", "underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps"], langKey: 'sidebar.bulkUpload' },
    { title: "Manage Employees", icon: Users, href: "/usermanagement", children: [
        ], access: ["admin"], langKey: 'sidebar.manageEmployees' },
    { title: "Collections", icon: BookMarked, href: "/collections", children: [], access: ["admin", "underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps"] },
    { title: "Service Requests", icon: NetworkIcon, href: "/servicereqs", children: [], access: ["admin", "underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps"] },
    { title: "Expiration Calendar", icon: CalendarClock, href: "/calendar", children: [], access: ["admin", "underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps"] },
    { title: "Personas", icon: User, href: "/", children: [
            {title: "Underwriter", icon: User, href: "/underwriter", children: [], access: [], langKey: 'sidebar.underwriter'},
            {title: "Business Analyst", icon: User, href: "/businessanalyst", children: [], access: [], langKey: "sidebar.businessAnalyst"},
            {title: "Actuarial Analyst", icon: User, href: "/actuarialanalyst", children: [], access: [], langKey: "sidebar.actuarialAnalyst"},
            {title: "EXL Operations", icon: User, href: "/exloperations", children: [], access: [], langKey: "sidebar.exlOperations"},
            {title: "Business Operations", icon: User, href: "/businessoperations", children: [], access: [], langKey: "sidebar.businessOperations"},
        ], access: [], langKey: "sidebar.personas" },
    { title: "Search", icon: Search, href: "/search", children: [], access: ["admin", "underwriter", "businessAnalyst", "actuarialAnalyst", "EXLOperator", "businessOps"] },
]

function AppSidebar() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    const {user} = useUser();
    const {toggleSidebar} = useSidebar();

    return (
        <Sidebar className="bg-sidebar border-r-2! fixed shadow-[4px_0_15px_rgba(0,0,0,0.2)]" variant="sidebar" collapsible="offcanvas">

            <SidebarHeader className="p-4">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">Hanover CMA</h1>
                        <p className="text-sm text-muted-foreground">{ts('sidebar.team')}</p>
                    </div>
                    <Button onClick={ () => toggleSidebar()} className="cursor-pointer bg-transparent hover:bg-transparent hover:opcacity-80 transition-opacity">
                        <X className="w-5! h-5! text-primary"></X>
                    </Button>
                </div>

            </SidebarHeader>

            <hr className="w-[calc(100%-2rem)] mx-auto h-px bg-primary border-none" />

            <SidebarContent className="p-2">

                <SidebarMenu>
                    {navItems
                        .filter((item : NavItem)=> item.access.length === 0 || (user && item.access.includes(user.persona)))
                        .map((item: NavItem) => (

                        item.children.length > 0 ? (
                            //makes the sidebar collapsable
                            <Collapsible key={item.title}>
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton className="active:scale-[0.98] shrink-0 px-2 py-4 my-1 text-md transition-all duration-200 hover:opacity-80">
                                            <item.icon />
                                            <span>{ item.langKey ? ts(item.langKey) : item.title}</span>
                                            <ChevronDown className="transition-transform duration-200 [[data-state=open]>&]:rotate-180"/>
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenu className="pl-6">

                                            {item.children
                                                .filter((childItem : NavItem)=> childItem.access.length === 0 || (user && childItem.access.includes(user.persona)))
                                                .map( (childItem: NavItem) => (
                                                //Collapsible Children
                                                <SidebarMenuItem key={childItem.title}>
                                                    <SidebarMenuButton onClick={ () => toggleSidebar() } className= "active:scale-[0.98] shrink-0 px-2 py-4 my-1 text-md transition-all duration-200 hover:opacity-80" asChild>
                                                        <Link to={childItem.href}>
                                                            <childItem.icon />
                                                            <span>{childItem.langKey? ts(childItem.langKey) : childItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            ))}

                                        </SidebarMenu>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ) : (
                            //Single item
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton onClick={ () => toggleSidebar() } className="active:scale-[0.98] shrink-0 px-2 py-4 my-1 text-md transition-all duration-200 hover:opacity-90 hover: group/item" asChild>
                                    <Link to={item.href}>
                                        <item.icon />
                                        <span className="">{item.langKey ? ts(item.langKey) : item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )

                    ))}
                </SidebarMenu>

            </SidebarContent>

            <hr className="w-[calc(100%-2rem)] mx-auto h-px bg-primary border-none" />

            <SidebarFooter className="p-4 border-t-2">
                <div className="flex flex-row items-center justify-between pl-0 pr-2">
                    <Link to="/about">
                        <Button className="cursor-pointer px-4 py-2 text-sm" variant="outline" onClick={ () => toggleSidebar() } >
                            <HelpCircle />
                            About
                        </Button>
                    </Link>
                    <Link to="/credits">
                        <Button className="cursor-pointer px-4 py-2 text-sm" variant="outline" onClick={ () => toggleSidebar() }  >
                            <FileText />
                            Credits
                        </Button>
                    </Link>
                </div>
            </SidebarFooter>

        </Sidebar>
    )
}

export default AppSidebar;
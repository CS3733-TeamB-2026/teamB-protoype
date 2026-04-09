import { Home, FilePlus, User, ChevronDown, LucideFolders, Users, UserPlus, X, Library, UserCog, LayoutDashboard } from "lucide-react"
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

type NavItem = {
    title: string;
    icon: React.ComponentType;
    href: string;
    children: NavItem[];
    access: string[];
}

/*
Add pages here, icons imported from lucide react
For dropdowns, add more items in children array, leave the array empty for single items
 */
const navItems = [
    { title: "Home", icon: Home, href: "/", children: [], access: [] },
    { title: "Dashboard", icon: LayoutDashboard, href: "/employeehome", children: [], access: ["admin", "underwriter", "businessAnalyst"] },
    { title: "Manage Content", icon: Library, href: "/", children: [
            { title: "View Content", icon: LucideFolders, href: "/files", children: [], access: ["admin", "underwriter", "businessAnalyst"] },
            { title: "Add Content", icon: FilePlus, href: "/manageform", children: [], access: ["admin", "underwriter", "businessAnalyst"] },
        ], access: ["admin", "underwriter", "businessAnalyst"] },
    { title: "Manage Employees", icon: UserCog, href: "/", children: [
            { title: "View Employees", icon: Users, href: "/usermanagement", children: [], access: ["admin"] },
            { title: "Add Employees", icon: UserPlus, href: "/employeeform", children: [], access: ["admin"] },
        ], access: ["admin"] },
    { title: "Personas", icon: User, href: "/", children: [
            {title: "Underwriter", icon: User, href: "/underwriter", children: [], access: []},
            {title: "Business Analyst", icon: User, href: "/businessanalyst", children: [], access: []},
        ], access: [] },
]

function AppSidebar() {

    //grabs the user type so that we only display the pages that user role can access
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const {toggleSidebar} = useSidebar();

    return (
        <Sidebar className="bg-sidebar border-r-2! fixed shadow-[4px_0_15px_rgba(0,0,0,0.2)]" variant="sidebar" collapsible="offcanvas">

            <SidebarHeader className="p-4">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">Hanover CMA</h1>
                        <p className="text-sm text-muted-foreground">Team B - D26</p>
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
                                            <span>{item.title}</span>
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
                                                            <span>{childItem.title}</span>
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
                                        <span className="">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )

                    ))}
                </SidebarMenu>

            </SidebarContent>

            <hr className="w-[calc(100%-2rem)] mx-auto h-px bg-primary border-none" />

            <SidebarFooter className="p-4 border-t-2">
                <p className="text-xs text-muted-foreground">CS3733 D26</p>
            </SidebarFooter>

        </Sidebar>
    )
}

export default AppSidebar;
import { Home, FormInput, User, ChevronDown, Users, ClipboardPenIcon, LucideFolders } from "lucide-react"
import React from "react"
import {Link} from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible"

type NavItem = {
    title: string;
    icon: React.ComponentType;
    href: string;
    children: NavItem[];
    access: string[];
}

//Add pages here, icons imported from lucide react
//For dropdowns, add more items in children array, leave array empty for single item
const navItems = [
    { title: "Home", icon: Home, href: "/", children: [], access: [] },
    { title: "User Management", icon: Users, href: "/usermanagement", children: [], access: ["admin"] },
    { title: "Add Employee Form", icon: ClipboardPenIcon, href: "/employeeform", children: [], access: ["admin"] },
    { title: "Management Form", icon: FormInput, href: "/manageform", children: [], access: [] },
    { title: "Files", icon: LucideFolders, href: "/files", children: [], access: [] },
    { title: "Personas", icon: User, href: "/", children: [
            {title: "Underwriter", icon: User, href: "/underwriter", children: [], access: []},
            {title: "Business Analyst", icon: User, href: "/businessanalyst", children: [], access: []},
        ], access: [] },
]

function AppSidebar() {

    const user = JSON.parse(localStorage.getItem("user") || "null");

    return (
        <Sidebar className="bg-sidebar border-r-2!">

            <SidebarHeader className="p-4">
                <h1 className="text-lg font-semibold tracking-tight">Hanover CMA</h1>
                <p className="text-sm text-muted-foreground">Team B - D26</p>
            </SidebarHeader>

            <hr className="w-[calc(100%-2rem)] mx-auto h-px bg-primary border-none" />

            <SidebarContent className="p-2">

                <SidebarMenu>
                    {navItems
                        .filter((item : NavItem)=> item.access.length === 0 || (user && item.access.includes(user.persona)))
                        .map((item: NavItem) => (

                        item.children.length > 0 ? (
                            //Collapsible
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

                                            {item.children.map( (childItem: NavItem) => (
                                                //Collapsible Children
                                                <SidebarMenuItem key={childItem.title}>
                                                    <SidebarMenuButton className= "active:scale-[0.98] shrink-0 px-2 py-4 my-1 text-md transition-all duration-200 hover:opacity-80" asChild>
                                                        <Link to={childItem.href}>
                                                            <item.icon />
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
                                <SidebarMenuButton className="active:scale-[0.98] shrink-0 px-2 py-4 my-1 text-md transition-all duration-200 hover:opacity-90 hover: group/item" asChild>
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
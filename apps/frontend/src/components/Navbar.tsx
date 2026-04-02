import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from "@/components/ui/navigation-menu.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Link, Route, Routes} from "react-router-dom";
import Home from "@/components/Home.tsx";
import EmployeeForm from "@/components/EmployeeForm.tsx";
import ManagementForm from "@/components/manageform.tsx";
import Underwriter from "@/components/Underwriter.tsx";
import BusinessAnalyst from "@/components/BusinessAnalyst.tsx";

function Navbar() {
    return (
        <>
            <nav className="bg-primary text-primary-foreground p-4 w-full shrink-0">
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
                            >Manage Form</NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem className="relative">

                            <DropdownMenu>
                                <DropdownMenuTrigger className="hover:text-muted-foreground transition-colors text-xl">
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
            </nav>
            <main className="flex-1 bg-secondary">
                {/*Routing*/}
                <Routes>
                    {/*This is where Home gets loaded automatically when it detected we are on "/" page*/}
                    <Route path="/" element={<Home/>}/>
                    <Route path="/employeeform" element={<EmployeeForm/>}/>
                    <Route path="/manageform" element={<ManagementForm/>}/>
                    <Route path="/underwriter" element={<Underwriter/>}/>
                    <Route path="/businessanalyst" element={<BusinessAnalyst/>}/>
                </Routes>
            </main>
        </>
    )
}
export default Navbar;
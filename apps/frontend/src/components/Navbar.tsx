import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from "@/components/ui/navigation-menu.tsx";
import {Route, Routes} from "react-router-dom";
import Home from "@/components/Home.tsx";
import ManagementForm from "@/components/ManageForm.tsx";

function Navbar(){
    return (
        <div className="min-h-screen flex flex-col">
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
                                href="/about"
                                className="hover:text-muted-foreground transition-colors text-xl"
                            >About</NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/contact"
                                className="hover:text-muted-foreground transition-colors text-xl"
                            >Contact</NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/manageform"
                                className="hover:text-muted-foreground transition-colors text-xl"
                            >Manage Form</NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </nav>

            <main className="flex-1 bg-secondary">
                <Routes>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/about" element={<About/>}/>
                    <Route path="/contact" element={<Contact/>}/>
                    <Route path="/manageform" element={<ManagementForm/>}/>
                </Routes>
            </main>

            <footer className="shrink-0 bg-primary text-primary-foreground mt-auto py-8 px-6">
                <div className="w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="font-bold text-lg">Hanover Content Manager</h3>
                        <p className="text-sm text-primary-foreground/70">&copy; 2026 Team B. All Rights Reserved.</p>
                    </div>

                    <div className="text-center md:text-right">
                        <h3 className="font-bold text-lg">This is a footer</h3>
                        <p className="text-sm text-primary-foreground/70">TODO - add more footer</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function About() {
    return <h1>About Page</h1>;
}

function Contact() {
    return <h1>Contact Page</h1>;
}

export default Navbar
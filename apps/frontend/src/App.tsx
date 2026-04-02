import './App.css'
import Home from './components/Home'
import ManagementForm from './components/manageform'
import EmployeeForm from './components/EmployeeForm'
import BusinessAnalyst from './components/BusinessAnalyst'
import Underwriter from './components/Underwriter'
import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

function App() {
    // Your application must be wrapped with the BrowserRouter component to enable routing
    return (
        <BrowserRouter>

            <div className="min-h-screen flex flex-col">

                {/*Navigation Menu*/}
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
                                    <DropdownMenuContent className="w-48 bg-primary text-primary-foreground border-none shadow-lg ">
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
                        <Route path="/" element={<Home/>}/>
                        <Route path="/employeeform" element={<EmployeeForm/>}/>
                        <Route path="/manageform" element={<ManagementForm/>}/>
                        <Route path="/underwriter" element={<Underwriter/>}/>
                        <Route path="/businessanalyst" element={<BusinessAnalyst/>}/>
                    </Routes>
                </main>

                {/*Footer (Appears on all pages)*/}
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

        </BrowserRouter>
    )
}

export default App

import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import {BrowserRouter} from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Home from "@/components/Home.tsx";
import AddEmployee from "@/components/AddEmployee.tsx";
import AddContent from "@/components/AddContent.tsx";
import Underwriter from "@/components/Underwriter.tsx";
import BusinessAnalyst from "@/components/BusinessAnalyst.tsx";
import EmployeeHome from "@/components/EmployeeHome";
import ViewEmployees from "@/components/ViewEmployees.tsx";
import ViewContent from "@/components/ViewContent.tsx";
import SidebarOverlay from "./components/SidebarOverlay";
import { Route, Routes} from "react-router-dom";

function App() {
    // Your application must be wrapped with the BrowserRouter component to enable routing
    return (

        <BrowserRouter>

            <SidebarProvider defaultOpen={false}>
                <AppSidebar />
                <SidebarOverlay />
                <div className="flex flex-col flex-1 min-h-screen">
                    <Navbar />
                    <main className="flex-1 bg-secondary">
                        {/*Routing*/}
                        <Routes>
                            {/*This is where Home gets loaded automatically when it detected we are on "/" page*/}
                            <Route path="/" element={<Home/>}/>
                            <Route path="/employeeform" element={<AddEmployee/>}/>
                            <Route path="/manageform" element={<AddContent/>}/>
                            <Route path="/usermanagement" element={<ViewEmployees/>}/>
                            <Route path="/underwriter" element={<Underwriter/>}/>
                            <Route path="/businessanalyst" element={<BusinessAnalyst/>}/>
                            <Route path="/files" element={<ViewContent/>}/>
                            <Route path="/employeehome" element={<EmployeeHome/>}/>
                        </Routes>
                    </main>
                    <Footer />
                </div>

            </SidebarProvider>

        </BrowserRouter>
    )
}
export default App

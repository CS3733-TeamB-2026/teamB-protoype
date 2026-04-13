import './App.css'
import Navbar from './components/layout/Navbar.tsx'
import Footer from './components/layout/Footer.tsx'
import {BrowserRouter} from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar.tsx";
import Home from "@/pages/Home.tsx";
import AddEmployee from "@/pages/AddEmployee.tsx";
import AddContent from "@/pages/AddContent.tsx";
import UnderwriterPersona from "@/pages/UnderwriterPersona.tsx";
import BusinessAnalystPersona from "@/pages/BusinessAnalystPersona.tsx";
import EmployeeHome from "@/pages/EmployeeHome.tsx";
import ViewEmployees from "@/pages/ViewEmployees.tsx";
import ViewContent from "@/pages/ViewContent.tsx";
import { ViewSingleFile } from "@/pages/VIewSingleFile.tsx";
import SidebarOverlay from "./components/layout/SidebarOverlay.tsx";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import React from "react";

function App() {

    const ProtectedRoute = ({ children }: {children: React.ReactNode}) => {
        const { isLoading, isAuthenticated } = useAuth0();

        if (isLoading) return <div>Loading...</div>;
        if (!isAuthenticated) return <Navigate to="/" />;

        return <>{children}</>;
    }

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
                            <Route path="/employeeform" element={<ProtectedRoute><AddEmployee/></ProtectedRoute>}/>
                            <Route path="/manageform" element={<ProtectedRoute><AddContent/></ProtectedRoute>}/>
                            <Route path="/usermanagement" element={<ProtectedRoute><ViewEmployees/></ProtectedRoute>}/>
                            <Route path="/underwriter" element={<UnderwriterPersona/>}/>
                            <Route path="/businessanalyst" element={<BusinessAnalystPersona/>}/>
                            <Route path="/files" element={<ProtectedRoute><ViewContent/></ProtectedRoute>}/>
                            <Route path="/employeehome" element={<ProtectedRoute><EmployeeHome/></ProtectedRoute>}/>
                            <Route path="/file/:id" element={<ProtectedRoute><ViewSingleFile/></ProtectedRoute>}/>
                        </Routes>
                    </main>
                    <Footer />
                </div>

            </SidebarProvider>

        </BrowserRouter>
    )
}
export default App

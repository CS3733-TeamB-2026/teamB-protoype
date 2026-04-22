import './App.css'
import { Toaster } from "@/components/ui/sonner.tsx";
import Navbar from './components/layout/Navbar.tsx'
import Footer from './components/layout/Footer.tsx'
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar.tsx";
import Home from "@/pages/Home.tsx";
import AddEmployee from "@/features/employees/AddEmployee.tsx";
import UnderwriterPersona from "@/pages/UnderwriterPersona.tsx";
import BusinessAnalystPersona from "@/pages/BusinessAnalystPersona.tsx";
import Dashboard from "@/features/dashboard/Dashboard.tsx";
import ViewEmployees from "@/features/employees/ViewEmployees.tsx";
import ViewContent from "@/features/content/listing/ViewContent.tsx";
import { BulkUploadPage } from "@/features/content/bulk/BulkUploadPage.tsx";
import { ViewSingleFile } from "@/features/content/previews/ViewSingleFile.tsx";
import SidebarOverlay from "./components/layout/SidebarOverlay.tsx";
import { Route, Routes } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {LocaleProvider} from "@/languageSupport/localeContext.tsx";
import SettingsLayout from "@/features/settings/SettingsLayout.tsx";
import AppearanceSettings from "@/features/settings/sections/AppearanceSettings.tsx";
import ProfileSettings from "@/features/settings/sections/ProfileSettings.tsx"
import ExperationCalendar from "@/features/content/listing/ExpirationCalendar.tsx"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth0();

    if (!isAuthenticated) return <Navigate to="/" />;

    return <>{children}</>;
};


function App() {

    const { isLoading } = useAuth0();

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    // Your application must be wrapped with the BrowserRouter component to enable routing
    return (

        <LocaleProvider>
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
                            <Route path="/usermanagement" element={<ProtectedRoute><ViewEmployees/></ProtectedRoute>}/>
                            <Route path="/underwriter" element={<UnderwriterPersona/>}/>
                            <Route path="/businessanalyst" element={<BusinessAnalystPersona/>}/>
                            <Route path="/files" element={<ProtectedRoute><ViewContent/></ProtectedRoute>}/>
                            <Route path="/files/bulk" element={<ProtectedRoute><BulkUploadPage/></ProtectedRoute>}/>
                            <Route path="/employeehome" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
                            <Route path="/calendar" element={<ExperationCalendar/>}/>
                            <Route path="/file/:id" element={<ProtectedRoute><ViewSingleFile/></ProtectedRoute>}/>
                            <Route path="/settings" element={<ProtectedRoute><SettingsLayout/></ProtectedRoute>}>
                                <Route index element={<ProtectedRoute><Navigate to="profile" replace /></ProtectedRoute>} />
                                <Route path="appearance" element={<ProtectedRoute><AppearanceSettings/></ProtectedRoute>} />
                                <Route path="profile" element={<ProtectedRoute><ProfileSettings/></ProtectedRoute>} />
                            </Route>
                        </Routes>
                    </main>
                    <Footer />
                </div>

            </SidebarProvider>
            <Toaster />
        </LocaleProvider>

    )
}
export default App

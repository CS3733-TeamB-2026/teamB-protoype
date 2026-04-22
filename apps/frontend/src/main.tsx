import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider } from '@/context/UserContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "@/context/ThemeProvider.tsx";
import { Auth0ProviderWithNavigate } from "@/context/Auth0ProviderWithNavigate.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider defaultTheme="light">
                <Auth0ProviderWithNavigate>
                    <UserProvider>
                        <App />
                    </UserProvider>
                </Auth0ProviderWithNavigate>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
);
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Auth0Provider } from '@auth0/auth0-react';
import { UserProvider } from '@/context/UserContext.tsx';
import { BrowserRouter, useNavigate } from 'react-router-dom';

function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    return (
        <Auth0Provider
            domain="dev-s638hh1d5ry67sv6.us.auth0.com"
            clientId="uInLEc9TqrOiGyZi4QrhhN70WFS52N3I"
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: "https://hanover-cma-api"
            }}
            onRedirectCallback={(appState) => {
                navigate(appState?.returnTo || '/employeehome');
            }}
        >
            {children}
        </Auth0Provider>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Auth0ProviderWithNavigate>
                <UserProvider>
                    <App />
                </UserProvider>
            </Auth0ProviderWithNavigate>
        </BrowserRouter>
    </StrictMode>
);
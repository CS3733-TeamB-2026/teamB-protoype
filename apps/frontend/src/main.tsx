import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Auth0Provider } from '@auth0/auth0-react';

createRoot(document.getElementById('root')!).render(

    <StrictMode>
        <Auth0Provider
            domain="dev-s638hh1d5ry67sv6.us.auth0.com"
            clientId="uInLEc9TqrOiGyZi4QrhhN70WFS52N3I"
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: "https://hanover-cma-api"
            }}
        >
            <App />
        </Auth0Provider>
    </StrictMode>,
)
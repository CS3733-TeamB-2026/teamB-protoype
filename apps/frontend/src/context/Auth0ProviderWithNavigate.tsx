import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
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
import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';

function Callback() {
    const { isLoading, error, handleRedirectCallback } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        const processRedirect = async () => {
            try {
                await handleRedirectCallback(); // Auth0 processes the redirect
                navigate('/calendar'); // Go to the calendar route
            } catch (err) {
                console.error('Auth0 callback processing failed:', err);
            }
        };

        processRedirect();
    }, [handleRedirectCallback, navigate]);

    if (isLoading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="text-red-600">Error: {error.message}</div>;

    return null;
}

export default Callback;

import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';

export default function LandingPage() {
    const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/calendar');
        }
    }, [isLoading, isAuthenticated, navigate]);

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-3xl font-bold mb-4">Welcome to Means</h1>
            {!isAuthenticated && !isLoading && (
                <button
                    onClick={() => loginWithRedirect()}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Sign In to Continue
                </button>
            )}
        </div>
    );
}
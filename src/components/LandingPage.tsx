import { useAuth0 } from '@auth0/auth0-react';

export default function LandingPage() {
    const { loginWithRedirect, isAuthenticated } = useAuth0();

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-3xl font-bold mb-4">Welcome to Means</h1>
            {!isAuthenticated && (
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
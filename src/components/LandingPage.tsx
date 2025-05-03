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
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h1 className="text-4xl font-bold mb-2 font-sans">Welcome to Means</h1>
            <p className="text-gray-700 text-lg mb-6 max-w-md">
                Plan your finances with clarity. A simple calendar-based budget tracker built for peace of mind.
            </p>

            {!isAuthenticated && !isLoading && (
                <button
                    onClick={() => loginWithRedirect()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                    Sign In to Continue
                </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 text-gray-600 text-sm">
                <div>💸 Track Income & Expenses</div>
                <div>📆 View Monthly Totals</div>
                <div>🔁 Support for Recurring Entries</div>
            </div>

            <footer className="mt-12 text-xs text-gray-500">
                Demo app built for portfolio use only.
            </footer>
        </div>
    );

}
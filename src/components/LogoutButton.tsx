import { useAuth0 } from '@auth0/auth0-react';

export default function LogoutButton() {
    const { logout } = useAuth0();

    return (
        <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white"
        >
            Log Out
        </button>
    );
}

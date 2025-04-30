import { useAuth0 } from '@auth0/auth0-react';


export const authFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const { getAccessTokenSilently } = useAuth0();

    const token = await getAccessTokenSilently();

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    return fetch(url, {
        ...options,
        headers,
    });
};

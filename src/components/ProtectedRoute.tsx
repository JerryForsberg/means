// src/components/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth0();

    if (isLoading) return <p>Loading...</p>;
    if (!isAuthenticated) return <Navigate to="/" replace />;

    return <>{children}</>;
};

export default ProtectedRoute;

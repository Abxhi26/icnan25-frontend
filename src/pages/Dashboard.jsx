import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// This component simply decides admin/staff and redirects accordingly.
export default function Dashboard() {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;
    if (user.role === 'ADMIN') {
        return <Navigate to="/admin" />;
    }
    return <Navigate to="/dashboard" />;
}

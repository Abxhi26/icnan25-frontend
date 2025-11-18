import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const login = async (identifier, password) => {
        const res = await api.post('/auth/login', { identifier, password });
        setUser(res.data.user);
        // Store JWT token in localStorage
        localStorage.setItem('token', res.data.token);
    };
    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

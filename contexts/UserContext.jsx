// SAMPLEREACTAPP/contexts/UserContext.jsx

import { createContext, useState } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const API_URL = "http://192.168.0.124:3001/api"; // Or your local IP

    async function login(email, password) {
        // Login implementation
    }

    const register = async (userData) => {
        try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return await response.json();
        } catch (error) {
        return { success: false, message: "Network error" };
        }
    };

    async function logout() {
        // Logout implementation
    }

    return (
        <UserContext.Provider value={{ user, login, register, logout }}>
            {children}
        </UserContext.Provider>
    );
}
// SAMPLEREACTAPP/contexts/UserContext.jsx

import { createContext, useState } from "react";
import { pool } from '../my-app-backend/services/db';
import * as Crypto from 'expo-crypto';
import { encode as btoa } from 'base-64';

export const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);

    async function hashPassword(password) {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password + process.env.APP_SALT,
            { encoding: Crypto.CryptoEncoding.HEX }
        );
    }

    async function login(email, password) {
        // Login implementation
    }

    async function register(role, firstName, middleName, lastName, suffix, gender, birthday, lrn, teacher_id, email, password) {
        try {
            const hashedPassword = await hashPassword(password);
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            const [result] = await pool.query(
                `INSERT INTO registration_users 
                (email, first_name, middle_name, last_name, suffix, gender, birth_date, lrn, teacher_id, role_id, code, password) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, firstName, middleName, lastName, suffix, gender, birthday, lrn, teacher_id, role, code, hashedPassword]
            );
            
            return { success: true, userId: result.insertId };
        } catch (error) {
            console.error("Registration error:", error);
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: "Email already exists" };
            }
            return { success: false, message: "Registration failed. Please try again." };
        }
    }

    async function logout() {
        // Logout implementation
    }

    return (
        <UserContext.Provider value={{ user, login, register, logout }}>
            {children}
        </UserContext.Provider>
    );
}
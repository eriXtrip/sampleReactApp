// root/hooks/useUser.jsx
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    
    // Return the full context and add aliases for compatibility
    return {
        ...context,
        // Alias loading as isLoading for compatibility with your splash screen
        isLoading: context.loading,
        // Alias loadUserSession as checkAuthStatus for compatibility
        checkAuthStatus: context.loadUserSession,
        // Also expose the original properties
        loading: context.loading,
        user: context.user,
        setUser: context.setUser,
        // Add dbInitialized for easier access
        dbInitialized: context.dbInitialized,
        // Add database helper methods if available
        getDatabase: context.getDatabase,
        isDatabaseReady: context.isDatabaseReady
    };
}
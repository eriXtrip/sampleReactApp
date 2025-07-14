// services/testServerConnection.js
import { Alert } from 'react-native';

export const testServerConnection = async (API_URL) => {
  try {
    // Test endpoint
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Empty payload
    });

    // If the server responds (even with 400/401), it's reachable
    console.log("✅ Server is reachable. Status:", response.status);
    return true;

  } catch (error) {
    console.error("❌ Server unreachable:", error);
    Alert.alert(
      "Connection Error",
      "Offline mode is enabled. Some function may not work."
      //"Could not connect to the server. Please check your internet connection."
    );
    return false;
  }
};
// services/testServerConnection.js
export const testServerConnection = async (API_URL) => {
  if (!API_URL) return false; // Prevent undefined URLs
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (err) {
    console.log("❌ Server unreachable:", err.message);
    return false;
  }
};

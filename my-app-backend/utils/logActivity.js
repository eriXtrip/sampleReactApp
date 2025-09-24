import pool from '../services/db.js'; 

export async function logActivity(userId, activityName) {
    try {
        await pool.query(
            `INSERT INTO activity_log (activity_by, activity_name) VALUES (?, ?)`,
            [userId, activityName]
        );
        console.log(`Activity logged: ${activityName} by user ${userId}`);
    } catch (error) {
        console.error("Error logging activity:", error);
    }
}

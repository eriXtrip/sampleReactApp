// my-app-backend/controllers/ranking.js
import pool from '../services/db.js';

/**
 * GET /api/ranking/overall
 * Returns overall ranking based on the SQL VIEW: overall_ranking
 *
 * Query params:
 *    limit        - optional, return only top X
 *    pupil_id     - optional, return only one user's ranking
 */
export const getOverallRanking = async (req, res) => {
  console.log("📊 Fetching Overall Ranking...");

  try {
    let { limit, pupil_id } = req.query;

    let query = `
      SELECT 
        pupil_id,
        last_name,
        avatar_thumbnail,
        total_score,
        total_max_score,
        percentage,
        rank_position
      FROM overall_ranking
    `;
    
    const params = [];

    // Filter for a single pupil
    if (pupil_id) {
      query += ` WHERE pupil_id = ?`;
      params.push(pupil_id);
    }

    query += ` ORDER BY rank_position ASC`;

    // Apply limit for top N students
    if (limit) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
    }

    const [rows] = await pool.query(query, params);

    console.log(`🏆 Ranking rows returned: ${rows.length}`);

    return res.json({
      success: true,
      ranking: rows
    });

  } catch (error) {
    console.error("💥 Database error in getOverallRanking:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch overall ranking"
    });
  }
};
// my-app-backend/controllers/adminDashboard.js
import pool from '../services/db.js';
import { isUserAdmin } from '../utils/checkAdmin.js';

/**
 * GET /api/admin/lessons/count
 * Returns total lessons, pupils, teachers, and pupil gender stats — admin only.
 */
export const getTotalLessonsCount = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const admin = await isUserAdmin(userId);
    if (!admin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admins only.'
      });
    }

    console.log('📊 Fetching admin dashboard stats...');

    // Fetch lessons
    const [lessonsRows] = await pool.query('SELECT COUNT(*) AS total FROM lessons');
    const totalLessons = lessonsRows[0]?.total || 0;

    // Fetch counts by role
    const [pupilsRows] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE role_id = 3');
    const totalPupils = pupilsRows[0]?.total || 0;

    const [teachersRows] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE role_id = 2');
    const totalTeachers = teachersRows[0]?.total || 0;

    // Fetch gender distribution for pupils only
    const [genderRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) AS female,
        SUM(CASE WHEN gender = 'Prefer not to say' THEN 1 ELSE 0 END) AS prefer_not_to_say
      FROM users
    `);

    const genderStats = genderRows[0] || { male: 0, female: 0, prefer_not_to_say: 0 };

    console.log('✅ Admin stats:', {
      totalLessons,
      totalPupils,
      totalTeachers,
      genderStats
    });

    res.json({
      success: true,
      total_lessons: totalLessons,
      total_pupils: totalPupils,
      total_teachers: totalTeachers,
      gender: {
        male: Number(genderStats.male) || 0,
        female: Number(genderStats.female) || 0,
        prefer_not_to_say: Number(genderStats.prefer_not_to_say) || 0
      }
    });

  } catch (error) {
    console.error('💥 Error in getTotalLessonsCount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin dashboard stats',
    });
  }
};

/**
 * GET /api/admin/subjects/summary
 * Returns list of subjects with total lessons per quarter and total connected users.
 */
export const getSubjectSummary = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const admin = await isUserAdmin(userId);
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Access denied. Admins only.' });
    }

    console.log('📊 Fetching data from v_subject_summary...');
    const [rows] = await pool.query('SELECT * FROM v_subject_summary ORDER BY subject_name, quarter');

    res.json({
      success: true,
      total: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error('💥 Error in getSubjectSummary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject summary',
    });
  }
};


/**
 * GET /api/admin/subjects/users
 * Returns list of users connected to each subject.
 */
export const getSubjectUsers = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const admin = await isUserAdmin(userId);
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Access denied. Admins only.' });
    }

    console.log('👥 Fetching data from v_subject_users...');
    const [rows] = await pool.query(`
      SELECT 
        subject_id,
        user_id,
        first_name,
        last_name,
        email,
        avatar_thumbnail
      FROM v_subject_users
      ORDER BY subject_id, last_name, first_name
    `);

    res.json({
      success: true,
      total: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error('💥 Error in getSubjectUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject user data',
    });
  }
};

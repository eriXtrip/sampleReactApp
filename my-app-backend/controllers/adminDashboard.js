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

    // 🧠 User activity stats
    const [activityRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(active_status = TRUE) AS active_users
      FROM users
    `);

    const totalUsers = activityRows[0]?.total_users || 0;
    const activeUsers = activityRows[0]?.active_users || 0;

    // Compute activity rate (%)
    const activeRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0;

    console.log('✅ Admin stats:', {
      totalLessons,
      totalPupils,
      totalTeachers,
      genderStats,
      totalUsers,
      activeUsers,
      activeRate
    });

    res.json({
      success: true,
      total_lessons: totalLessons,
      total_pupils: totalPupils,
      total_teachers: totalTeachers,
      total_users: totalUsers,
      active_users: activeUsers,
      active_rate_percent: activeRate,
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
      SELECT * FROM v_subject_users
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

/**
 * GET /api/admin/subjects/lessons
 * Returns ALL lessons and their contents (pretest first, posttest last)
 */
export const getSubjectLessonsAndContents = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const admin = await isUserAdmin(userId);
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Access denied. Admins only.' });
    }

    // 1. Fetch ACTIVE Lessons only
    const [lessonsRows] = await pool.query(
      `SELECT
        l.lesson_id,
        l.lesson_title,
        l.lesson_number,
        l.description,
        l.subject_belong,
        s.subject_name,
        l.quarter
      FROM lessons l
      JOIN subjects s ON l.subject_belong = s.subject_id
      WHERE l.status = TRUE
      ORDER BY l.quarter ASC, l.lesson_number ASC`
    );

    // 2. Fetch Contents — only for ACTIVE lessons
    const [contentsRows] = await pool.query(
      `SELECT
          content_id,
          lesson_belong,
          content_type,
          title
       FROM subject_contents
       WHERE lesson_belong IN (
         SELECT lesson_id
         FROM lessons
         WHERE status = TRUE
       )
       ORDER BY
         lesson_belong ASC,
         CASE 
           WHEN title LIKE '%pretest%' OR title LIKE '%Pre-Test%' OR title LIKE '%Pre Test%' THEN 1
           WHEN title LIKE '%posttest%' OR title LIKE '%Post-Test%' OR title LIKE '%Post Test%' THEN 3
           ELSE 2
         END ASC,
         content_id ASC`
    );

    // LOG RAW ROWS BEFORE SEND
    console.log('lessonsRows (raw DB result):', lessonsRows);
    console.log('contentsRows (raw DB result):', contentsRows);

    console.log(`Found ${lessonsRows.length} lessons and ${contentsRows.length} contents`);

    res.json({
      success: true,
      lessons: lessonsRows,
      contents: contentsRows
    });

  } catch (error) {
    console.error('Error in getSubjectLessonsAndContents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lessons and contents',
    });
  }
};

/**
 * GET /api/admin/teachers/sections
 * Returns all teachers with their sections and assigned subjects
 */
export const getTeachersWithSections = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const admin = await isUserAdmin(userId);
    if (!admin) {
      return res.status(403).json({ success: false, error: 'Access denied. Admins only.' });
    }

    console.log('👩‍🏫 Fetching teachers with their sections and subjects...');

    const [rows] = await pool.query(`
     SELECT 
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        u.email,
        s.section_id,
        s.section_name,
        subj.subject_id,
        subj.subject_name,
        a.thumbnail AS thumbnail
      FROM users u
      LEFT JOIN sections s 
        ON s.teacher_id = u.user_id
      LEFT JOIN subjects_in_section sis 
        ON sis.section_belong = s.section_id
      LEFT JOIN subjects subj 
        ON subj.subject_id = sis.subject_id
      LEFT JOIN avatar a 
        ON u.avatar_id = a.id
      WHERE u.role_id = 2
      ORDER BY u.user_id, s.section_id
    `);

    res.json({
      success: true,
      total: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error('💥 Error in getTeachersWithSections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teachers with sections and subjects',
    });
  }
};

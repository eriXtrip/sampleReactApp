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
    const [rows] = await pool.query(
      'SELECT * FROM v_subject_summary ORDER BY subject_name, quarter'
    );

    console.log('📊 Fetching raw subject performance summary...');
    const [performance] = await pool.query(`
      SELECT 
          s.subject_name,
          l.quarter,
          l.lesson_id,
          l.lesson_title,
          ROUND(AVG(pp.progress_percent), 2) AS avg_progress,
          COUNT(pp.pupil_id) AS total_pupils,
          SUM(pp.status = 1) AS total_completed
      FROM lessons l
      JOIN subjects s 
          ON s.subject_id = l.subject_belong
      LEFT JOIN pupil_progress pp 
          ON pp.lesson_id = l.lesson_id
      GROUP BY 
          s.subject_name,
          l.quarter,
          l.lesson_id,
          l.lesson_title
      ORDER BY 
          s.subject_name,
          l.quarter,
          l.lesson_number
    `);

    const [pupils] = await pool.query(`
      SELECT
        u.user_id AS pupil_id,
        CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.last_name) AS full_name,
        a.thumbnail AS avatar_thumbnail,
        r.role_name AS role,
        u.created_at,
        u.active_status,
        u.last_active,
        u.email,
        u.birth_date,
        sec.school_name,
        ROUND(AVG(TIME_TO_SEC(STR_TO_DATE(pcp.duration, '%H:%i:%s'))), 2) AS avg_session_seconds,
        COUNT(DISTINCT pa.id) AS total_badges
      FROM users u
      LEFT JOIN avatar a ON u.avatar_id = a.id
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN enroll_me e ON u.user_id = e.pupil_id
      LEFT JOIN sections sec ON e.section_id = sec.section_id
      LEFT JOIN pupil_content_progress pcp ON u.user_id = pcp.pupil_id
      LEFT JOIN pupil_achievements pa ON u.user_id = pa.pupil_id
      WHERE u.role_id = 3
      GROUP BY u.user_id, full_name, a.thumbnail, r.role_name, u.created_at, u.active_status, u.last_active, u.email, u.birth_date, sec.school_name
      ORDER BY u.last_name, u.first_name
    `);

    // 🟢 Teachers list
    const [teachers] = await pool.query(` 
      SELECT
          t.user_id,
          a.thumbnail AS avatar_thumbnail,
          r.role_name AS role,
          CONCAT(t.first_name, ' ', COALESCE(t.middle_name, ''), ' ', t.last_name) AS full_name,
          t.created_at,
          t.active_status,
          t.last_active,
          t.email,
          t.birth_date,
          GROUP_CONCAT(DISTINCT tso.school_name SEPARATOR ', ') AS schools,
          GROUP_CONCAT(DISTINCT tso.section_name SEPARATOR ', ') AS sections_created,
          COALESCE(SUM(tso.pupil_count), 0) AS total_pupils
      FROM users t
      LEFT JOIN avatar a
          ON t.avatar_id = a.id
      LEFT JOIN roles r
          ON t.role_id = r.role_id
      LEFT JOIN teacher_sections_overview tso
          ON t.user_id = tso.teacher_id
      WHERE t.role_id = 2
      GROUP BY t.user_id, a.thumbnail, r.role_name, t.first_name, t.middle_name, t.last_name,
              t.created_at, t.active_status, t.last_active, t.email, t.birth_date
      ORDER BY t.last_name
    `);

    // console.log("Teachers:", teachers);

    // 🟢 Student progress per subject
    const [studentProgress] = await pool.query(`
      SELECT
        v.pupil_id,
        v.subject_name,
        v.school_name,
        v.section_id,
        v.completed_lessons,
        v.total_lessons,
        v.progress_percent,
        ROUND(sub_avg_score.avg_score, 2) AS avg_score
      FROM v_pupil_progress_with_school v
      LEFT JOIN (
        SELECT 
          pts.pupil_id, 
          s.subject_name, 
          AVG(pts.score) AS avg_score
        FROM pupil_test_scores pts
        JOIN lessons l ON pts.test_id = l.lesson_id
        JOIN subjects s ON l.subject_belong = s.subject_id
        GROUP BY pts.pupil_id, s.subject_name
      ) sub_avg_score
      ON v.pupil_id = sub_avg_score.pupil_id 
      AND v.subject_name = sub_avg_score.subject_name
      ORDER BY v.pupil_id, v.subject_name
    `);


    // 🟢 FORMAT subject performance with zero-fill for missing subject/quarter
    const formattedPerformance = {};

    // Step 1: Insert all found rows
    performance.forEach(row => {
      const {
        subject_name,
        quarter,
        lesson_id,
        lesson_title,
        avg_progress,
        total_pupils,
        total_completed
      } = row;

      if (!formattedPerformance[subject_name]) {
        formattedPerformance[subject_name] = {};
      }

      if (!formattedPerformance[subject_name][quarter]) {
        formattedPerformance[subject_name][quarter] = [];
      }

      formattedPerformance[subject_name][quarter].push({
        lesson_id,
        lesson_title,
        avg_progress: avg_progress ?? 0,
        total_pupils: total_pupils ?? 0,
        total_completed: total_completed ?? 0,
      });
    });

    // 🟢 SEND BOTH: original + formatted
    res.json({
      success: true,
      total: rows.length,
      data: rows,   
      Pupils_list: pupils,
      Teachers_list: teachers,
      Student_progress_Subject: studentProgress,                             // Untouched original
      subject_performance: formattedPerformance, // NEW formatted
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

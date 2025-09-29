// controllers/userSyncController.js 
import pool from '../services/db.js'; // your MySQL connection

export const getSyncData = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT middleware

    // 1. Fetch user's sections (with teacher_name)
    const [sections] = await pool.query(`
      SELECT 
        s.section_id,
        s.teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
        s.section_name,
        s.school_year
      FROM sections s
      LEFT JOIN users t ON s.teacher_id = t.user_id
      WHERE s.teacher_id = ? 
         OR s.section_id IN (
           SELECT section_id FROM enroll_me WHERE pupil_id = ?
         )
    `, [userId, userId]);

    // Get all section_ids for the user
    const sectionIds = sections.map(s => s.section_id);

    // 1b. Fetch subjects_in_section (only for sections where pupil is enrolled)
    let subjectsInSection = [];
    if (sectionIds.length > 0) {
      const [sisRows] = await pool.query(
        `SELECT 
          sis.section_belong, 
          sis.subject_id, 
          sis.assigned_at
        FROM subjects_in_section sis
        JOIN enroll_me em ON em.section_id = sis.section_belong
        JOIN subjects s ON sis.subject_id = s.subject_id
        WHERE em.pupil_id = ?`,
        [userId]
      );
      subjectsInSection = sisRows;
    }

    // 2. Fetch subjects in those sections
    let subjects = [];
    if (sectionIds.length > 0) {
      const [subs] = await pool.query(`
        SELECT DISTINCT
          sub.subject_id,
          sub.subject_name,
          sub.grade_level,
          sub.description,
          sub.is_public
        FROM subjects_in_section sis
        JOIN subjects sub ON sis.subject_id = sub.subject_id
        WHERE sis.section_belong IN (?)
      `, [sectionIds]);
      subjects = subs;
    }

    // 2b. Fetch subjects directly enrolled (subject-only, no section)
    const [directSubs] = await pool.query(`
      SELECT DISTINCT
        s.subject_id,
        s.subject_name,
        s.description,
        s.is_public
      FROM enroll_me e
      JOIN subjects s ON e.subject_id = s.subject_id
      WHERE e.pupil_id = ?
        AND e.subject_id IS NOT NULL
        AND e.section_id IS NULL
    `, [userId]);

    // Merge section-based and direct subjects, remove duplicates
    const seen = new Set();
    const allSubjects = [...subjects, ...directSubs].filter(sub => {
      if (seen.has(sub.subject_id)) return false;
      seen.add(sub.subject_id);
      return true;
    });

    const subjectIds = allSubjects.map(s => s.subject_id);

    // 3. Fetch lessons for those subjects
    let lessons = [];
    let lessonIds = [];
    if (subjectIds.length > 0) {
      const [less] = await pool.query(`
        SELECT 
          lesson_id,
          lesson_title,
          description,
          subject_belong,
          quarter
        FROM lessons
        WHERE subject_belong IN (?)
      `, [subjectIds]);
      lessons = less;
      lessonIds = less.map(l => l.lesson_id);
    }

    // 4. Fetch subject_contents (metadata only)
    let contents = [];
    if (lessonIds.length > 0) {
      const [cont] = await pool.query(`
        SELECT 
          content_id,
          lesson_belong,
          content_type,
          url,
          title,
          description,
          file_name
        FROM subject_contents
        WHERE lesson_belong IN (?)
      `, [lessonIds]);
      contents = cont;
    }

    // 5. Fetch games linked to these subjects or contents
    let games = [];
    if (subjectIds.length > 0 || contents.length > 0) {
      const contentIds = contents.map(c => c.content_id);
      const [gms] = await pool.query(`
        SELECT 
          game_id,
          subject_id,
          content_id,
          game_type_id,
          title,
          description
        FROM games
        WHERE subject_id IN (?) 
           OR (content_id IS NOT NULL AND content_id IN (?))
      `, [subjectIds, contentIds.length > 0 ? contentIds : [0]]);
      games = gms;
    }

    // 6. Fetch game_types (global, not user-specific)
    const [gameTypes] = await pool.query(`
      SELECT 
        game_type_id,
        name,
        description
      FROM game_types
    `);

    // 7. Fetch user notifications
    const [notifications] = await pool.query(`
      SELECT 
        notification_id,
        title,
        message,
        type,
        is_read,
        created_at,
        read_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `, [userId]);

    // 8. Fetch test scores
    const [testScores] = await pool.query(`
      SELECT 
        score_id,
        test_id,
        score,
        max_score,
        attempt_number,
        taken_at
      FROM pupil_test_scores
      WHERE pupil_id = ?
    `, [userId]);

    // 9. Fetch earned achievements
    const [achievements] = await pool.query(`
      SELECT 
        pa.achievement_id,
        pa.earned_at,
        a.content_id
      FROM pupil_achievements pa
      JOIN achievements a ON pa.achievement_id = a.achievement_id
      WHERE pa.pupil_id = ?;
    `, [userId]);

    // 10. Fetch classmates (other pupils in the same sections)
    let classmates = [];
    if (sectionIds.length > 0) {
      const [classmateRows] = await pool.query(`
        SELECT DISTINCT
          u.user_id,
          u.first_name,
          u.middle_name,
          u.last_name,
          u.suffix
        FROM enroll_me e
        JOIN users u ON e.pupil_id = u.user_id
        WHERE e.section_id IN (?) 
          AND e.pupil_id != ?  -- exclude self
          AND u.role_id = 3    -- only pupils
      `, [sectionIds, userId]);

      classmates = classmateRows.map(u => {
        let name = u.first_name;

        // Add middle initial if exists
        if (u.middle_name && u.middle_name.trim()) {
          const initial = u.middle_name.trim().charAt(0).toUpperCase();
          name += ` ${initial}.`;
        }

        // Add last name
        name += ` ${u.last_name}`;

        // Add suffix if exists
        if (u.suffix && u.suffix.trim()) {
          name += ` ${u.suffix.trim()}`;
        }

        return {
          user_id: u.user_id,
          full_name: name.trim()
        };
      });
    }
    

    // ✅ Send all data in one response
    res.json({
      sections,
      subjects_in_section: subjectsInSection,
      subjects: allSubjects, // merged subjects (sections + direct enrollments)
      lessons,
      subject_contents: contents,
      games,
      game_types: gameTypes,
      notifications,
      pupil_test_scores: testScores,
      pupil_achievements: achievements,
      classmates
    });

  } catch (error) {
    console.error('Sync data error:', error);
    res.status(500).json({ error: 'Failed to fetch sync data' });
  }
};

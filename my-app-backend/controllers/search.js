// my-app-backend/controllers/search.js
import pool from '../services/db.js';

/**
 * GET /api/search/subjects
 * Returns all public subjects with their lessons and contents (if any)
 */
export const getPublicSubjects = async (req, res) => {
  console.log('🔍 Fetching public subjects...');

  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    // Query public subjects that user is NOT enrolled in
    const [subjects] = await pool.query(
      `
      SELECT 
        s.subject_id,
        s.subject_name,
        s.description,
        s.created_at,
        s.updated_at,
        u.first_name AS created_by_first,
        u.last_name AS created_by_last
      FROM subjects s
      INNER JOIN users u ON s.created_by = u.user_id
      LEFT JOIN enroll_me e 
        ON e.subject_id = s.subject_id 
        AND e.pupil_id = ? 
        AND e.status = TRUE
      WHERE s.is_public = TRUE 
        AND e.enrollment_id IS NULL
      ORDER BY s.created_at DESC
      `,
      [user_id]
    );

    console.log('📚 Subjects found (not enrolled):', subjects.length);

    if (subjects.length === 0) {
      return res.json({ success: true, subjects: [] });
    }

    // Collect subject IDs for lessons
    const subjectIds = subjects.map(s => s.subject_id);
    const placeholders = subjectIds.map(() => '?').join(',');

    const [lessons] = await pool.query(
      `
      SELECT 
        lesson_id,
        lesson_title,
        description,
        subject_belong,
        quarter
      FROM lessons
      WHERE subject_belong IN (${placeholders})
      ORDER BY quarter, lesson_id
      `,
      subjectIds
    );

    const lessonIds = lessons.map(l => l.lesson_id);
    let contents = [];
    if (lessonIds.length > 0) {
      const contentPlaceholders = lessonIds.map(() => '?').join(',');
      [contents] = await pool.query(
        `
        SELECT 
          content_id,
          lesson_belong,
          content_type,
          url,
          title,
          description,
          file_name,
          uploaded_at
        FROM subject_contents
        WHERE lesson_belong IN (${contentPlaceholders})
        ORDER BY uploaded_at
        `,
        lessonIds
      );
    }

    // Nest lessons + contents under subjects
    const subjectsWithLessons = subjects.map(subject => {
      const subjectLessons = lessons
        .filter(lesson => lesson.subject_belong === subject.subject_id)
        .map(lesson => ({
          ...lesson,
          contents: contents.filter(c => c.lesson_belong === lesson.lesson_id),
        }));

      return { ...subject, lessons: subjectLessons };
    });

    res.json({
      success: true,
      subjects: subjectsWithLessons,
    });

  } catch (error) {
    console.error('💥 Database error in getPublicSubjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public subjects',
    });
  }
};


export const getSectionsForSearch = async (req, res) => {
  try {
    // Get user_id from query (since user is "already logged in" and no token needed)
    const { user_id } = req.query;

    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Fetch sections (exclude sections the user is already enrolled in)
    const [sections] = await pool.query(`
      SELECT 
        sec.section_id,
        sec.section_name,
        sec.school_year,
        sec.teacher_id,
        u.first_name AS teacher_first,
        u.last_name AS teacher_last,
        COUNT(se.pupil_id) AS enrolled_count
      FROM sections sec
      INNER JOIN users u ON sec.teacher_id = u.user_id
      LEFT JOIN enroll_me se ON sec.section_id = se.section_id
      WHERE sec.section_id NOT IN (
        SELECT section_id 
        FROM enroll_me 
        WHERE pupil_id = ?
      )
      GROUP BY sec.section_id
      ORDER BY sec.school_year DESC, sec.section_name ASC
    `, [user_id]);

    console.log('📚 Sections found:', sections.length);

    // Format response
    const formattedSections = sections.map(sec => ({
      section_id: sec.section_id,
      section_name: sec.section_name,
      school_year: sec.school_year,
      teacher: `${sec.teacher_first} ${sec.teacher_last}`,
      enrolled_count: sec.enrolled_count
    }));

    res.json({
      success: true,
      sections: formattedSections
    });

  } catch (error) {
    console.error('Error fetching sections for search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sections'
    });
  }
};
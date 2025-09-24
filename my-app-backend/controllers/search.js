// my-app-backend/controllers/search.js
import pool from '../services/db.js';

/**
 * GET /api/search/subjects
 * Returns all public subjects with their lessons and contents (if any)
 */
export const getPublicSubjects = async (req, res) => {
  console.log('🔍 Fetching public subjects...');

  try {
    // Query public subjects
    const [subjects] = await pool.query(`
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
      WHERE s.is_public = FALSE
      ORDER BY s.created_at DESC
    `);

    console.log('📚 Subjects found:', subjects.length);

    // If no subjects, return empty array
    if (subjects.length === 0) {
      return res.json({ success: true, subjects: [] });
    }

    // Get all lesson IDs for these subjects
    const subjectIds = subjects.map(s => s.subject_id);
    const placeholders = subjectIds.map(() => '?').join(',');
    
    // Fetch lessons for these subjects
    const [lessons] = await pool.query(`
      SELECT 
        lesson_id,
        lesson_title,
        description,
        subject_belong,
        quarter
      FROM lessons
      WHERE subject_belong IN (${placeholders})
      ORDER BY quarter, lesson_id
    `, subjectIds);

    // Get all lesson IDs to fetch contents
    const lessonIds = lessons.map(l => l.lesson_id);
    let contents = [];
    if (lessonIds.length > 0) {
      const contentPlaceholders = lessonIds.map(() => '?').join(',');
      [contents] = await pool.query(`
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
      `, lessonIds);
    }

    // Build nested structure: subject → lessons → contents
    const subjectsWithLessons = subjects.map(subject => {
      const subjectLessons = lessons
        .filter(lesson => lesson.subject_belong === subject.subject_id)
        .map(lesson => {
          const lessonContents = contents.filter(
            content => content.lesson_belong === lesson.lesson_id
          );
          return { ...lesson, contents: lessonContents };
        });

      return {
        ...subject,
        lessons: subjectLessons
      };
    });

    res.json({
      success: true,
      subjects: subjectsWithLessons
    });

  } catch (error) {
     console.error('💥 Database error in getPublicSubjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public subjects'
    });
  }
};

export const getSectionsForSearch = async (req, res) => {
  try {
    // Get user_id from query (since you said "already logged in" and no token needed)
    // In real app, you'd get this from req.user via auth middleware
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
      LEFT JOIN section_enrollments se ON sec.section_id = se.section_id
      WHERE sec.section_id NOT IN (
        SELECT section_id 
        FROM section_enrollments 
        WHERE pupil_id = ?
      )
      GROUP BY sec.section_id
      ORDER BY sec.school_year DESC, sec.section_name ASC
    `, [user_id]);

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
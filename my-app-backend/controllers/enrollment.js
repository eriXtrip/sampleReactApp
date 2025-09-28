// my-app-backend/controllers/enrollment.js
import pool from '../services/db.js';
import bcrypt from 'bcryptjs';

/**
 * POST /api/enrollment/verify
 * Handle enrollment for:
 * - Public subjects → instant approval (no key needed)
 * - Sections → verify enrollment key if exists
 */
export const verifyEnrollment = async (req, res) => {
  const { pupil_id, section_id, subject_id, enrollment_key } = req.body;

  // Validate input
  if (!pupil_id || (!section_id && !subject_id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'pupil_id and (section_id or subject_id) are required' 
    });
  }

  try {
    // Handle SUBJECT enrollment
    if (subject_id) {
      // ✅ Check if already enrolled
      const [existingSubjectEnroll] = await pool.query(
        'SELECT 1 FROM enroll_me WHERE pupil_id = ? AND subject_id = ? AND status = TRUE',
        [pupil_id, subject_id]
      );

      if (existingSubjectEnroll.length > 0) {
        return res.json({ 
          success: true, 
          message: 'Already enrolled in this subject' 
        });
      }

      // Check if subject is public
      const [subjectRows] = await pool.query(
        'SELECT is_public FROM subjects WHERE subject_id = ?',
        [subject_id]
      );

      if (subjectRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Subject not found' });
      }

      const { is_public } = subjectRows[0];
      
      // Public subject → approve immediately
      if (is_public) {
        await pool.query(
          `INSERT INTO enroll_me (pupil_id, subject_id, status) 
           VALUES (?, ?, TRUE)
           ON DUPLICATE KEY UPDATE status = TRUE`,
          [pupil_id, subject_id]
        );
        return res.json({ success: true, message: 'Enrolled in public subject' });
      }

      // Private subject (not implemented yet) would require key
      // But per your spec, we don't have private subjects
      return res.status(403).json({ 
        success: false, 
        error: 'Subject is not public' 
      });
    }

    // Handle SECTION enrollment
    if (section_id) {
      // Check if section has an enrollment key
      const [sectionRows] = await pool.query(
        'SELECT enrollment_key FROM sections WHERE section_id = ?',
        [section_id]
      );

      if (sectionRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Section not found' });
      }

      const { enrollment_key: storedKeyHash } = sectionRows[0];

      // No key required → approve immediately
      if (!storedKeyHash) {
        await pool.query(
          `INSERT INTO enroll_me (pupil_id, section_id, status) 
           VALUES (?, ?, TRUE)
           ON DUPLICATE KEY UPDATE status = TRUE`,
          [pupil_id, section_id]
        );
        return res.json({ success: true, message: 'Enrolled in section' });
      }

      // Key required → verify
      if (!enrollment_key) {
        return res.status(400).json({ 
          success: false, 
          error: 'Enrollment key is required' 
        });
      }

      const isValid = await bcrypt.compare(enrollment_key, storedKeyHash);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid enrollment key' 
        });
      }

      // ✅ Check if already enrolled
      const [existingSectionEnroll] = await pool.query(
        'SELECT 1 FROM enroll_me WHERE pupil_id = ? AND section_id = ? AND status = TRUE',
        [pupil_id, section_id]
      );

      if (existingSectionEnroll.length > 0) {
        return res.json({ 
          success: true, 
          message: 'Already enrolled in this section' 
        });
      }

      // Approve enrollment
      await pool.query(
        `INSERT INTO enroll_me (pupil_id, section_id, status) 
         VALUES (?, ?, TRUE)
         ON DUPLICATE KEY UPDATE status = TRUE`,
        [pupil_id, section_id]
      );
      return res.json({ success: true, message: 'Enrolled in section with key' });
    }

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Enrollment failed' 
    });
  }
};

export const checkSectionRequiresKey = async (req, res) => {
  const { sectionId } = req.params;

  try {
    const [sectionRows] = await pool.query(
      'SELECT enrollment_key FROM sections WHERE section_id = ?',
      [sectionId]
    );

    if (sectionRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    const { enrollment_key } = sectionRows[0];
    res.json({ 
      success: true, 
      requires_key: enrollment_key !== null 
    });

  } catch (error) {
    console.error('Section key check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check section requirements' 
    });
  }
};
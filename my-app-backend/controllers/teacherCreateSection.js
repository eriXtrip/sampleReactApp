// my-app-backend/controllers/teacherCreateSection.js

import pool from "../services/db.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";

/**
 * POST /api/teacher/create/section
 * Create new section for a teacher
 */
export async function createSection(req, res) {
    const { teacherId, school_name, school_year, section_name } = req.body;

    try {
        // 1. Verify teacherId exists
        if (!teacherId) {
            return res.status(400).json({ error: "Missing teacherId in token." });
        }

        // 2. Fetch the user's role using teacherId
        const [rows] = await pool.query(
            "SELECT role_id FROM users WHERE user_id = ? LIMIT 1",
            [teacherId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Teacher not found." });
        }

        const role_id = rows[0].role_id;

        // 3. Check if role_id is teacher (2)
        if (role_id !== 2) {
            return res.status(403).json({ error: "Only teachers can create sections." });
        }

        // 4. Validate payload
        if (!school_name || !school_year || !section_name) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // 5. Generate enrollment key
        const enrollment_key = generateEnrollmentKey();

        const hashedEnrollment_Code = await bcrypt.hash(enrollment_key, 10);

        // 6. Insert new section
        const sql = `
            INSERT INTO sections (teacher_id, school_name, section_name, school_year, enrollment_key, enrollment_code)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(sql, [
            teacherId,
            school_name,
            section_name,
            school_year,
            hashedEnrollment_Code,
            enrollment_key
            
        ]);

        console.log(teacherId, section_name, section_name, school_year, enrollment_key, hashedEnrollment_Code);

        // Simulate MySQL insertId
        // const result = { insertId: 12345 };  // sample insertId

        return res.json({
            message: "Section created successfully!",
            section_id: result.insertId,
            hashedEnrollment_Code
        });

    } catch (err) {
        console.error("Error creating section:", err);
        return res.status(500).json({ error: "Server error while creating section." });
    }
}



// Utility: Generate random enrollment key
function generateEnrollmentKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 6; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
}


/**
 * GET /api/teacher/Fetchsections
 * Fetch all sections handled by a teacher + pupils enrolled
 */
export async function fetchSectionsAndPupils(req, res) {
    const { teacherId } = req.body;

    try {
        // Validate teacher exists and is role_id = 2
        const [check] = await pool.query(
            "SELECT role_id FROM users WHERE user_id = ? LIMIT 1",
            [teacherId]
        );

        if (check.length === 0) {
            return res.status(404).json({ error: "Teacher not found." });
        }

        if (check[0].role_id !== 2) {
            return res.status(403).json({ error: "Only teachers can fetch sections." });
        }

        // Fetch all sections handled by teacher
        const [sections] = await pool.query(
            `SELECT 
                  s.section_id,
                  s.section_name,
                  s.school_year,
                  s.enrollment_key,
                  s.enrollment_code,
                  s.created_at,
                  COUNT(e.enrollment_id) AS noEnrolled
            FROM sections s
            LEFT JOIN enroll_me e ON s.section_id = e.section_id AND e.status = 1
            WHERE s.teacher_id = ?
            GROUP BY s.section_id
            ORDER BY s.created_at DESC`,
            [teacherId]
        );

        if (sections.length === 0) {
            return res.json({ sections: [], pupils: [] });
        }

        // Get all section IDs
        const sectionIds = sections.map(s => s.section_id);

        // Fetch all pupils in these sections
        const [pupils] = await pool.query(
            `
            SELECT 
                u.user_id,
                a.thumbnail,
                CONCAT(u.first_name, ' ', 
                       IFNULL(CONCAT(u.middle_name, ' '), ''), 
                       u.last_name,
                       IFNULL(CONCAT(' ', u.suffix), '')
                ) AS fullname,
                u.lrn AS LRN,
                TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) AS age,
                em.status AS enrollment_status,
                u.active_status,
                u.email,
                em.enrollment_date,
                u.gender,
                em.section_id,
                s.section_name
            FROM enroll_me em
            JOIN users u ON u.user_id = em.pupil_id
            LEFT JOIN avatar a ON a.id = u.avatar_id
            JOIN sections s ON s.section_id = em.section_id 
            WHERE em.section_id IN (?)
            ORDER BY em.enrollment_date DESC
            `,
            [sectionIds]
        );

        return res.json({
            sections,
            pupils
        });

    } catch (err) {
        console.error("Error fetching sections and pupils:", err);
        return res.status(500).json({ error: "Server error while fetching sections." });
    }
}
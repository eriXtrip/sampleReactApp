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
                CONCAT(u.first_name,' ', IFNULL(CONCAT(u.middle_name,' '),''), u.last_name, IFNULL(CONCAT(' ',u.suffix),'')) AS fullname,
                
                -- Pupil info
                a.thumbnail,
                u.lrn AS LRN,
                TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) AS age,
                em.status AS enrollment_status,
                u.active_status,
                u.email,
                u.birth_date,
                em.enrollment_date,
                u.gender,
                em.section_id,
                s.section_name,
                
                -- Performance Summary
                IFNULL(curr_avg.avg_mastery,0) AS avg_mastery,
                IFNULL(curr_avg.avg_mastery - prev_avg.avg_mastery,0) AS avg_mastery_change,
                CASE 
                    WHEN curr_avg.avg_mastery - prev_avg.avg_mastery >= 5 THEN 'Improving'
                    WHEN curr_avg.avg_mastery - prev_avg.avg_mastery <= -5 THEN 'Declining'
                    ELSE 'Stable'
                END AS mastery_status,
                
                IFNULL(curr_eng.sessions,0) AS engagement_sessions,
                IFNULL(curr_eng.avg_session_minutes,0) AS avg_session_minutes,
                CASE 
                    WHEN curr_eng.sessions - prev_eng.sessions >= 2 THEN 'Active'
                    WHEN curr_eng.sessions - prev_eng.sessions <= -2 THEN 'Slight Dip'
                    ELSE 'Stable'
                END AS engagement_status,
                
                IFNULL(curr_badges.badges_earned,0) AS badges_earned,
                IFNULL(curr_badges.badges_earned - prev_badges.badges_earned,0) AS badges_change,
                CASE 
                    WHEN curr_badges.badges_earned - prev_badges.badges_earned >= 2 THEN 'Motivated'
                    WHEN curr_badges.badges_earned - prev_badges.badges_earned < 0 THEN 'Falling Behind'
                    ELSE 'No Change'
                END AS badges_status,

                -- Recent Activity
                (
                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                        'notification_id', n.notification_id,
                        'type', n.type,
                        'title', n.title,
                        'message', n.message,
                        'created_at', n.created_at
                    ))
                    FROM (
                        SELECT *
                        FROM notifications
                        WHERE user_id = u.user_id
                        ORDER BY created_at DESC
                        LIMIT 3
                    ) n
                ) AS recent_activity,

                -- Subject progress
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'subject_id', p.subject_id,
                            'subject_name', p.subject_name,
                            'progress_percent', p.progress_percent,
                            'class_avg', class_avg.class_avg,
                            'status', CASE
                                WHEN p.progress_percent < class_avg.class_avg THEN 'Below class avg'
                                WHEN p.progress_percent > class_avg.class_avg THEN 'Above class avg'
                                ELSE 'On track'
                            END
                        )
                    )
                    FROM v_pupil_progress_with_school p
                    JOIN (
                        SELECT subject_id, AVG(progress_percent) AS class_avg, section_id
                        FROM v_pupil_progress_with_school
                        GROUP BY subject_id, section_id
                    ) class_avg 
                    ON class_avg.subject_id = p.subject_id AND class_avg.section_id = em.section_id
                    WHERE p.pupil_id = u.user_id
                ) AS subject_progress


            FROM enroll_me em
            JOIN users u ON u.user_id = em.pupil_id
            LEFT JOIN avatar a ON a.id = u.avatar_id
            JOIN sections s ON s.section_id = em.section_id

            -- Mastery
            LEFT JOIN (
                SELECT pupil_id, SUM(score)/SUM(max_score)*100 AS avg_mastery
                FROM pupil_test_scores
                WHERE MONTH(taken_at) = MONTH(CURDATE()) AND YEAR(taken_at) = YEAR(CURDATE())
                GROUP BY pupil_id
            ) curr_avg ON curr_avg.pupil_id = u.user_id
            LEFT JOIN (
                SELECT pupil_id, SUM(score)/SUM(max_score)*100 AS avg_mastery
                FROM pupil_test_scores
                WHERE MONTH(taken_at) = MONTH(CURDATE())-1 AND YEAR(taken_at) = YEAR(CURDATE())
                GROUP BY pupil_id
            ) prev_avg ON prev_avg.pupil_id = u.user_id

            -- Engagement
            LEFT JOIN (
                SELECT pupil_id, COUNT(*) AS sessions, AVG(duration) AS avg_session_minutes
                FROM pupil_content_progress
                WHERE MONTH(last_accessed) = MONTH(CURDATE()) AND YEAR(last_accessed) = YEAR(CURDATE())
                GROUP BY pupil_id
            ) curr_eng ON curr_eng.pupil_id = u.user_id
            LEFT JOIN (
                SELECT pupil_id, COUNT(*) AS sessions
                FROM pupil_content_progress
                WHERE MONTH(last_accessed) = MONTH(CURDATE())-1 AND YEAR(last_accessed) = YEAR(CURDATE())
                GROUP BY pupil_id
            ) prev_eng ON prev_eng.pupil_id = u.user_id

            -- Badges
            LEFT JOIN (
                SELECT pupil_id, COUNT(*) AS badges_earned
                FROM pupil_achievements
                WHERE MONTH(earned_at) = MONTH(CURDATE()) AND YEAR(earned_at) = YEAR(CURDATE())
                GROUP BY pupil_id
            ) curr_badges ON curr_badges.pupil_id = u.user_id
            LEFT JOIN (
                SELECT pupil_id, COUNT(*) AS badges_earned
                FROM pupil_achievements
                WHERE MONTH(earned_at) = MONTH(CURDATE())-1 AND YEAR(earned_at) = YEAR(CURDATE())
                GROUP BY pupil_id
            ) prev_badges ON prev_badges.pupil_id = u.user_id

            WHERE em.section_id IN (?)
            ORDER BY em.enrollment_date DESC;

            `,
            [sectionIds]
        );

        // Fetch lesson-level progress for all pupils and all subjects in one query
        const pupilIds = pupils.map(p => p.user_id);
        const subjectIds = pupils.flatMap(p => p.subject_progress?.map(s => s.subject_id) || []);

        if (pupilIds.length && subjectIds.length) {
            const [lessonProgressRows] = await pool.query(
                `SELECT 
                    l.lesson_number,
                    l.lesson_title,
                    pts.pupil_id,
                    l.subject_belong AS subject_id,
                    subj.subject_name,
                    l.quarter,
                    IFNULL(SUM(pts.score) / SUM(pts.max_score) * 100, 0) AS mastery_percent,
                    IFNULL(COUNT(pcp.duration) / 8 * 100, 0) AS engagement_percent
                FROM lessons l
                LEFT JOIN subjects subj ON subj.subject_id = l.subject_belong
                LEFT JOIN subject_contents sc ON sc.lesson_belong = l.lesson_id
                LEFT JOIN tests t ON t.content_id = sc.content_id
                LEFT JOIN pupil_test_scores pts ON pts.test_id = t.test_id AND pts.pupil_id IN (?)
                LEFT JOIN pupil_content_progress pcp ON pcp.pupil_id IN (?) AND pcp.content_id = sc.content_id
                WHERE l.subject_belong IN (?)
                GROUP BY pts.pupil_id, l.subject_belong, l.lesson_number, l.lesson_title, subj.subject_name, l.quarter
                ORDER BY pts.pupil_id, l.subject_belong, l.lesson_number`,
                [pupilIds, pupilIds, subjectIds]
            );

            // Attach lesson progress to pupils using subject_name as key
            for (let pupil of pupils) {
                pupil.lesson_progress = {};
                for (let subject of pupil.subject_progress || []) {
                    const subjectName = subject.subject_name; // key by subject_name
                    pupil.lesson_progress[subjectName] = lessonProgressRows
                        .filter(lp => lp.pupil_id === pupil.user_id && lp.subject_name === subjectName)
                        .map(lp => ({
                            lesson_number: lp.lesson_number,
                            quarter: lp.quarter,
                            lesson_title: lp.lesson_title,
                            mastery_percent: lp.mastery_percent,
                            engagement_percent: lp.engagement_percent
                        }));
                }
            }

            // Compute overall progress per pupil
            for (let pupil of pupils) {
                if (pupil.subject_progress && pupil.subject_progress.length) {
                    const totalPercent = pupil.subject_progress.reduce((sum, subj) => sum + subj.progress_percent, 0);
                    pupil.overall_progress_percent = totalPercent / pupil.subject_progress.length;
                } else {
                    pupil.overall_progress_percent = 0;
                }
            }
        }


        return res.json({
            sections,
            pupils
        });

    } catch (err) {
        console.error("Error fetching sections and pupils:", err);
        return res.status(500).json({ error: "Server error while fetching sections." });
    }
}
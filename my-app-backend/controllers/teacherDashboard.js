import pool from "../services/db.js";

/**
 * GET /api/teacher/dashboard
 * Returns teacher dashboard stats including recent enrollees
 */
export const getTeacherDashboardStats = async (req, res) => {
    const teacherId = req.query.teacher_id;

    console.log("✅ getTeacherDashboardStats triggered");
    console.log("Teacher ID:", teacherId);

    if (!teacherId) {
        console.log("❌ No teacherId found in request");
        return res.status(401).json({ error: "Unauthorized: No user found in request." });
    }

    try {
        // 1️⃣ Validate teacher role
        const [teacherRows] = await pool.query(
            `SELECT role_id FROM users WHERE user_id = ? LIMIT 1`,
            [teacherId]
        );

        if (!teacherRows.length || teacherRows[0].role_id !== 2) {
            console.log("❌ User is not a teacher");
            return res.status(403).json({ error: "Access denied: User is not a teacher." });
        }

        console.log("✅ Teacher validated:", teacherId);

        // 2️⃣ Get sections handled by teacher
        const [sections] = await pool.query(
            `SELECT section_id FROM sections WHERE teacher_id = ?`,
            [teacherId]
        );

        if (!sections.length) {
            console.log("⚠️ No sections found for teacher:", teacherId);
            return res.json({
                total_pupils: 0,
                avg_score: 0,
                avg_session_time: 0,
                gender_stats: { male: 0, female: 0, prefer_not_to_say: 0 },
                recent_enrollees: [],
                recentMaterials: [],
                pupil_progress: [],
                recentActivity: [],
            });
        }

        const sectionIds = sections.map(s => s.section_id);

        // 3️⃣ Get pupils in these sections
        const [pupils] = await pool.query(
            `SELECT u.user_id, u.first_name, u.middle_name, u.last_name, u.lrn, u.gender, e.enrollment_date, a.thumbnail
             FROM enroll_me e
             JOIN users u ON e.pupil_id = u.user_id
             LEFT JOIN avatar a ON u.avatar_id = a.id
             WHERE e.section_id IN (?) AND u.role_id = 3
             ORDER BY e.enrollment_date DESC
             LIMIT 10`,
            [sectionIds]
        );

        const pupilIds = pupils.map(p => p.user_id);

        // 4️⃣ Count total pupils & gender breakdown
        let male = 0, female = 0, preferNot = 0;
        pupils.forEach(p => {
            if (p.gender === "Male") male++;
            else if (p.gender === "Female") female++;
            else if (p.gender === "Prefer not to say") preferNot++;
        });

        const totalPupils = pupilIds.length;

        // 5️⃣ Average test score
        let avgScore = 0;
        if (pupilIds.length) {
            const [scores] = await pool.query(
                `SELECT AVG(score) as avg_score FROM pupil_test_scores WHERE pupil_id IN (?)`,
                [pupilIds]
            );
            avgScore = scores[0]?.avg_score || 0;
        }

        // 6️⃣ Average session/activity time
        let avgSessionTime = 0;
        if (pupilIds.length) {
            const [progress] = await pool.query(
                `SELECT AVG(duration) as avg_duration
                 FROM pupil_content_progress
                 WHERE pupil_id IN (?) AND duration IS NOT NULL`,
                [pupilIds]
            );
            avgSessionTime = progress[0]?.avg_duration || 0;
        }

        // 7️⃣ Format recent enrollees
        const recentEnrollees = pupils.map(p => ({
            fullname: `${p.first_name} ${p.middle_name ?? ''} ${p.last_name}`.replace(/\s+/g,' ').trim(),
            lrn: p.lrn ?? 'N/A',
            enrollment_date: p.enrollment_date,
            thumbnail: p.thumbnail ?? null
        }));

        // 8️⃣ Get recent materials
        let recentMaterials = [];
        if (sectionIds.length) {
            try {
                  const [materials] = await pool.query(
                        `SELECT sc.content_id, sc.title, sc.content_type, sc.uploaded_at, l.lesson_title
                        FROM subject_contents sc
                        JOIN lessons l ON sc.lesson_belong = l.lesson_id
                        ORDER BY sc.uploaded_at DESC
                        LIMIT 5`,
                  );

                  recentMaterials = materials.map(m => ({
                        content_id: m.content_id,
                        title: m.title,
                        type: m.content_type,
                        url: m.url,
                        file_name: m.file_name,
                        uploaded_at: m.uploaded_at,
                        lesson_name: m.lesson_name
                  }));

            } catch (err) {
                  console.error("Error fetching recent materials:", err);
            }
        }

        // 9️⃣ Get pupil overall progress (sortable + filterable)
        let pupilProgress = [];
            if (sectionIds.length) {
            try {
                  const dateFilter = req.query.date ? `AND pp.last_accessed >= ?` : "";
                  const params = req.query.date ? [sectionIds, req.query.date] : [sectionIds];

                  const [progress] = await pool.query(
                        `
                        SELECT 
                        u.user_id,
                        CONCAT(u.first_name, ' ', IFNULL(u.middle_name,''), ' ', u.last_name) AS fullname,
                        ROUND(AVG(pp.progress_percent), 2) AS overall_progress,
                        MAX(pp.last_accessed) AS last_accessed
                        FROM enroll_me e
                        JOIN users u ON u.user_id = e.pupil_id
                        JOIN pupil_progress pp ON pp.pupil_id = u.user_id
                        WHERE e.section_id IN (?) 
                        ${dateFilter}
                        GROUP BY u.user_id
                        ORDER BY overall_progress DESC
                        `,
                        params
                  );

                  pupilProgress = progress.map(p => ({
                        fullname: p.fullname.trim(),
                        overall_progress: Number(p.overall_progress),
                        last_accessed: p.last_accessed
                  }));

            } catch (err) {
                  console.error("Error fetching pupil overall progress:", err);
            }
        }

        //  🔟 Recent Activity Timeline (unified)
      let recentActivity = [];
      try {
      const [activity] = await pool.query(
            `
            SELECT * FROM (

            -- Assessments (deduplicated)
            SELECT 
                  title, type, date, subtitle, fullname
            FROM (
                  SELECT 
                        t.test_title AS title,
                        'quiz' AS type,
                        ts.taken_at AS date,
                        CONCAT('Score: ', ts.score, '/', ts.max_score) AS subtitle,
                        CONCAT(u.first_name, ' ', u.middle_name, ' ', u.last_name) AS fullname,
                        ROW_NUMBER() OVER (PARTITION BY ts.test_id ORDER BY ts.taken_at DESC) AS rn
                  FROM pupil_test_scores ts
                  JOIN tests t ON t.test_id = ts.test_id
                  JOIN users u ON u.user_id = ts.pupil_id
                  WHERE ts.pupil_id = ?
            ) AS dedup
            WHERE rn = 1

            UNION ALL

            -- Games
            SELECT 
                  sc.title,
                  sc.content_type AS type,
                  pp.completed_at AS date,
                  CONCAT('Completed ', sc.title, ' game') AS subtitle,
                  CONCAT(u.first_name, ' ', u.middle_name, ' ', u.last_name) AS fullname
            FROM pupil_content_progress pp
            JOIN subject_contents sc ON sc.content_id = pp.content_id
            JOIN users u ON u.user_id = pp.pupil_id
            WHERE pp.pupil_id = ?
                  AND pp.completed_at IS NOT NULL

            UNION ALL

            -- Achievements
            SELECT 
                  a.title,
                  'achievement' AS type,
                  pa.earned_at AS date,
                  a.description AS subtitle,
                  CONCAT(u.first_name, ' ', u.middle_name, ' ', u.last_name) AS fullname
            FROM pupil_achievements pa
            JOIN achievements a ON a.achievement_id = pa.achievement_id
            JOIN users u ON u.user_id = pa.pupil_id
            WHERE pa.pupil_id = ?

            UNION ALL

            -- Enrollment
            SELECT
                  'Enrollment' AS title,
                  'enrollment' AS type,
                  e.enrollment_date AS date,
                  CONCAT('Enrolled in section ID ', e.section_id) AS subtitle,
                  CONCAT(u.first_name, ' ', u.middle_name, ' ', u.last_name) AS fullname
            FROM enroll_me e
            JOIN users u ON u.user_id = e.pupil_id
            WHERE e.pupil_id = ?

            ) AS all_activities
            ORDER BY date DESC
            LIMIT 0, 1000;
            `,
            [pupilIds, pupilIds, pupilIds, pupilIds]
      );

      recentActivity = activity;
      } catch (err) {
      console.error("Error fetching recent activity:", err);
      }

        avgScore = avgScore ? Number(avgScore) : 0;
        avgSessionTime = avgSessionTime ? Number(avgSessionTime) : 0;

        return res.json({
            total_pupils: totalPupils,
            avg_score: parseFloat(avgScore.toFixed(2)),
            avg_session_time: parseFloat(avgSessionTime.toFixed(2)),
            gender_stats: { male, female, prefer_not_to_say: preferNot },
            recent_enrollees: recentEnrollees,
            recentMaterials: recentMaterials,
            pupil_progress: pupilProgress,
            recentActivity: recentActivity,
        });

    } catch (error) {
        console.error("Error in getTeacherDashboardStats:", error);
        return res.status(500).json({ error: "Server error. Please try again." });
    }
};

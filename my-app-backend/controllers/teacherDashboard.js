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
                quarterlyProgress: [],
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
                  WHERE ts.pupil_id IN (?)
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
            WHERE pp.pupil_id IN (?)
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
            WHERE pa.pupil_id IN (?)

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
            WHERE e.pupil_id IN (?)

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

      // 9️⃣.1 Get Quarterly Progress via Stored Procedure
        let quarterlyProgress = {
            q1: {},
            q2: {},
            q3: {},
            q4: {}
        };

        try {
            const [spRows] = await pool.query("CALL GetTeacherQuarterlyProgress(?)", [teacherId]);

            const rows = spRows[0]; // MySQL returns result inside first element

            // Transform rows → { q1: { math: [75,80], science: [...] }, q2:{...} }
            for (const row of rows) {
                const qKey = `q${row.quarter}`;

                if (!quarterlyProgress[qKey][row.subject_name]) {
                    quarterlyProgress[qKey][row.subject_name] = [];
                }

                quarterlyProgress[qKey][row.subject_name].push(Number(row.progress_percent));
            }
        } catch (err) {
            console.error("❌ Error getting quarterly progress:", err);
        }

        // 1️⃣0️⃣ Overall Dashboard Performance Stats
        let overallStats = {
            performance: 0,
            engagement_rate: 0,
            completion_rate: 0,
            avg_study_time: 0,

            lastWeekPerformance: 0,
            lastWeekEngagement: 0,
            lastWeekCompletion: 0,
            lastWeekStudyTime: 0
        };

        try {
            // 1. Performance (overall)
            const [perf] = await pool.query(`
                SELECT AVG(pp.progress_percent) AS performance
                FROM pupil_progress pp
                JOIN enroll_me e ON e.pupil_id = pp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?;
            `, [teacherId]);

            // 1B. Performance (LAST WEEK)
            const [perfLast] = await pool.query(`
                SELECT AVG(pp.progress_percent) AS performance
                FROM pupil_progress pp
                JOIN enroll_me e ON e.pupil_id = pp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?
                AND YEARWEEK(pp.last_accessed, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1);
            `, [teacherId]);


            // 2. Engagement Rate (overall)
            const [engage] = await pool.query(`
                SELECT 
                    (SUM(CASE WHEN pcp.duration > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS engagement_rate
                FROM pupil_content_progress pcp
                JOIN enroll_me e ON e.pupil_id = pcp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?;
            `, [teacherId]);

            // 2B. Engagement Rate (LAST WEEK)
            const [engageLast] = await pool.query(`
                SELECT 
                    (SUM(CASE WHEN pcp.duration > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS engagement_rate
                FROM pupil_content_progress pcp
                JOIN enroll_me e ON e.pupil_id = pcp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?
                AND YEARWEEK(pcp.last_accessed, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1);
            `, [teacherId]);


            // 3. Completion Rate (overall)
            const [complete] = await pool.query(`
                SELECT 
                    (SUM(CASE WHEN pp.status = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS completion_rate
                FROM pupil_progress pp
                JOIN enroll_me e ON e.pupil_id = pp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?;
            `, [teacherId]);

            // 3B. Completion Rate (LAST WEEK)
            const [completeLast] = await pool.query(`
                SELECT 
                    (SUM(CASE WHEN pp.status = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS completion_rate
                FROM pupil_progress pp
                JOIN enroll_me e ON e.pupil_id = pp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?
                AND YEARWEEK(pp.last_accessed, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1);
            `, [teacherId]);


            // 4. Study Time (overall)
            const [study] = await pool.query(`
                SELECT AVG(pcp.duration) / 60 AS avg_study_time_minutes
                FROM pupil_content_progress pcp
                JOIN enroll_me e ON e.pupil_id = pcp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?;
            `, [teacherId]);

            // 4B. Study Time (LAST WEEK)
            const [studyLast] = await pool.query(`
                SELECT AVG(pcp.duration) / 60 AS avg_study_time_minutes
                FROM pupil_content_progress pcp
                JOIN enroll_me e ON e.pupil_id = pcp.pupil_id
                JOIN sections s ON s.section_id = e.section_id
                WHERE s.teacher_id = ?
                AND YEARWEEK(pcp.last_accessed, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1);
            `, [teacherId]);


            // Convert results
            overallStats.performance = Number(perf[0]?.performance || 0).toFixed(2);
            overallStats.engagement_rate = Number(engage[0]?.engagement_rate || 0).toFixed(2);
            overallStats.completion_rate = Number(complete[0]?.completion_rate || 0).toFixed(2);
            overallStats.avg_study_time = Number(study[0]?.avg_study_time_minutes || 0).toFixed(0);

            overallStats.lastWeekPerformance = Number(perfLast[0]?.performance || 0).toFixed(2);
            overallStats.lastWeekEngagement = Number(engageLast[0]?.engagement_rate || 0).toFixed(2);
            overallStats.lastWeekCompletion = Number(completeLast[0]?.completion_rate || 0).toFixed(2);
            overallStats.lastWeekStudyTime = Number(studyLast[0]?.avg_study_time_minutes || 0).toFixed(0);

        } catch (err) {
            console.error("❌ Error computing overall stats:", err);
        }

        // 1️⃣1️⃣ Fetch subjects with lessons and contents
        let subjects = {}; // use object instead of array

        try {
            // 1️⃣ Get all subjects
            const [subjectRows] = await pool.query(
                `SELECT subject_id, subject_name FROM subjects`
            );

            for (const subj of subjectRows) {
                // 2️⃣ Get lessons of this subject
                const [lessons] = await pool.query(
                    `SELECT 
                        l.lesson_id,
                        l.lesson_number,
                        l.lesson_title,
                        l.description,
                        l.quarter,
                        l.created_at
                    FROM lessons l
                    WHERE l.subject_belong = ? 
                    ORDER BY l.lesson_number ASC`,
                    [subj.subject_id]
                );

                // 3️⃣ For each lesson, get its contents
                for (const lesson of lessons) {
                    const [contents] = await pool.query(
                        `SELECT content_type, url, title, content_id
                        FROM subject_contents
                        WHERE lesson_belong = ?`,
                        [lesson.lesson_id]
                    );

                    // 4️⃣ For each content, if it's a quiz, fetch the quiz JSON from tests
                    for (const content of contents) {
                        if (content.content_type === "quiz" && content.content_id) {
                            const [quizRows] = await pool.query(
                                `SELECT 
                                    JSON_OBJECT(
                                        'title', t.test_title,
                                        'quizId', t.test_id,
                                        'contentId', t.content_id,
                                        'description', t.description,
                                        'settings', JSON_OBJECT(
                                            'mode', 'open',
                                            'password', '',
                                            'allowBack', TRUE,
                                            'instantFeedback', FALSE,
                                            'review', TRUE,
                                            'totalItems', (
                                                SELECT COUNT(*) FROM test_questions q WHERE q.test_id = t.test_id
                                            ),
                                            'maxScore', (
                                                SELECT SUM(
                                                    CASE
                                                        WHEN q.question_type = 'truefalse' THEN 1
                                                        WHEN q.question_type = 'enumeration' THEN (
                                                            SELECT COUNT(*) FROM question_choices c
                                                            WHERE c.question_id = q.question_id AND c.is_correct = 1
                                                        )
                                                        ELSE (
                                                            SELECT SUM(c.is_correct) FROM question_choices c
                                                            WHERE c.question_id = q.question_id
                                                        )
                                                    END
                                                ) FROM test_questions q WHERE q.test_id = t.test_id
                                            ),
                                            'passingScore', CONCAT(
                                                ROUND(
                                                    (t.passingScore / (SELECT COUNT(*) FROM test_questions q WHERE q.test_id = t.test_id)) * 100
                                                ), '%'
                                            ),
                                            'shuffleQuestions', TRUE,
                                            'shuffleChoices', TRUE
                                        ),
                                        'questions', (
                                            SELECT JSON_ARRAYAGG(
                                                JSON_MERGE_PATCH(
                                                    JSON_OBJECT(
                                                        'id', q.question_id,
                                                        'type', q.question_type,
                                                        'question', q.question_text
                                                    ),
                                                    CASE
                                                        WHEN q.question_type IN ('enumeration','truefalse') THEN
                                                            JSON_OBJECT(
                                                                'answer', (
                                                                    SELECT JSON_ARRAYAGG(c.choice_text)
                                                                    FROM question_choices c
                                                                    WHERE c.question_id = q.question_id AND c.is_correct = 1
                                                                )
                                                            )
                                                        ELSE
                                                            JSON_OBJECT(
                                                                'choices', (
                                                                    SELECT JSON_ARRAYAGG(
                                                                        JSON_OBJECT(
                                                                            'choice_id', c.choice_id,
                                                                            'text', c.choice_text,
                                                                            'points', c.is_correct
                                                                        )
                                                                    )
                                                                    FROM question_choices c
                                                                    WHERE c.question_id = q.question_id
                                                                )
                                                            )
                                                    END,
                                                    CASE
                                                        WHEN q.question_type = 'truefalse' THEN JSON_OBJECT('points', 1)
                                                        WHEN q.question_type = 'enumeration' THEN JSON_OBJECT(
                                                            'points', (
                                                                SELECT COUNT(*) FROM question_choices c
                                                                WHERE c.question_id = q.question_id AND c.is_correct = 1
                                                            )
                                                        )
                                                        ELSE JSON_OBJECT()
                                                    END
                                                )
                                            )
                                            FROM test_questions q
                                            WHERE q.test_id = t.test_id
                                        )
                                    ) AS quiz_json
                                FROM tests t
                                WHERE t.content_id = ?`,
                                [content.content_id]
                            );

                            // Replace the URL with the quiz JSON content
                            if (quizRows.length > 0) {
                                content.quiz_data = quizRows[0].quiz_json; // don't JSON.parse
                                delete content.url; // optional
                            }
                        }
                    }

                    lesson.lessons_content = contents; // attach contents (including quiz_data)
                }

                // 5️⃣ Attach lessons to subject_name key
                subjects[subj.subject_name] = {
                    lessons: lessons
                };
            }
        } catch (err) {
            console.error("Error fetching subjects with lessons:", err);
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
            quarterlyProgress: quarterlyProgress,
            overall_progress: overallStats,
            subjects: subjects,
        });

    } catch (error) {
        console.error("Error in getTeacherDashboardStats:", error);
        return res.status(500).json({ error: "Server error. Please try again." });
    }
};

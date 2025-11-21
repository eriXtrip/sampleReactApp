/**
 * Saves full user sync data from server into local SQLite database (transactional).
 * @param {Object} data - The full sync payload from /user/sync-data
 * @param {Object} db - Expo SQLite database instance
 */
export async function saveSyncDataToSQLite(data, db) {
  if (!db) {
    throw new Error("Database instance is required");
  }

  try {
    console.log("🚀 Starting sync transaction...");
    await db.execAsync("BEGIN TRANSACTION");

    // 🔥 Clear previous data
    // await db.execAsync(`
    //   DELETE FROM users;
    //   DELETE FROM sections;
    //   DELETE FROM subjects;
    //   DELETE FROM subjects_in_section;
    //   DELETE FROM lessons;
    //   DELETE FROM subject_contents;
    //   DELETE FROM games;
    //   DELETE FROM notifications;
    //   DELETE FROM pupil_test_scores;
    //   DELETE FROM pupil_achievements;
    //   DELETE FROM classmates;
    // `);

    // === 1. Sections ===
    if (Array.isArray(data.sections)) {
      for (const s of data.sections) {
        await db.runAsync(
          `INSERT INTO sections (
            server_section_id, teacher_id, teacher_name, section_name, school_name, school_year
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(server_section_id) DO UPDATE SET
            teacher_id=excluded.teacher_id,
            teacher_name=excluded.teacher_name,
            section_name=excluded.section_name,
            school_name=excluded.school_name,
            school_year=excluded.school_year;
          `,
          [
            s.section_id,
            s.teacher_id,
            s.teacher_name || "Unknown Teacher",
            s.section_name || "Unnamed Section",
            s.school_name || "",
            s.school_year || "",
          ]
        );
      }
    }

    // === 2. Subjects ===
    if (Array.isArray(data.subjects)) {
      for (const sub of data.subjects) {
        await db.runAsync(
          `INSERT INTO subjects (
            server_subject_id, subject_name, grade_level, description, is_public
          ) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(server_subject_id) DO UPDATE SET
            subject_name=excluded.subject_name,
            grade_level=excluded.grade_level,
            description=excluded.description,
            is_public=excluded.is_public;
          `,
          [
            sub.subject_id,
            sub.subject_name || "Unnamed Subject",
            sub.grade_level || "4",
            sub.description || null,
            Boolean(sub.is_public),
          ]
        );
      }
    }

    // === 3. Lessons ===
    if (Array.isArray(data.lessons)) {
      for (const l of data.lessons) {
        const localSubject = await db.getFirstAsync(
          "SELECT subject_id FROM subjects WHERE server_subject_id = ?",
          [l.subject_belong]
        );
        if (!localSubject) {
          console.warn("Skipping lesson (subject not found):", l.lesson_id);
          continue;
        }

        await db.runAsync(
          `INSERT INTO lessons (
            server_lesson_id, lesson_title, description, subject_belong, quarter, lesson_number, status, progress, last_accessed, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(server_lesson_id) DO UPDATE SET
              lesson_title=excluded.lesson_title,
              description=excluded.description,
              subject_belong=excluded.subject_belong,
              quarter=excluded.quarter,
              lesson_number=excluded.lesson_number,
              status=excluded.status,
              progress=excluded.progress,
              last_accessed=excluded.last_accessed,
              completed_at=excluded.completed_at;
          `,
          [
            l.lesson_id,
            l.lesson_title || "Untitled Lesson",
            l.description || null,
            localSubject.subject_id,
            l.quarter || 1,
            l.lesson_number,
            Boolean(l.status),
            l.progress || 0,
            l.last_accessed || null,
            l.completed_at || null,
          ]
        );
      }
    }

    // === 4. Subject Contents ===
    if (Array.isArray(data.subject_contents)) {
      for (const c of data.subject_contents) {
        const localLesson = await db.getFirstAsync(
          "SELECT lesson_id FROM lessons WHERE server_lesson_id = ?",
          [c.lesson_belong]
        );
        if (!localLesson) {
          console.warn("Skipping content (lesson not found):", c.content_id);
          continue;
        }

        await db.runAsync(
          `INSERT INTO subject_contents (
            server_content_id, lesson_belong, content_type, url, title, description, file_name, done, last_accessed, started_at, completed_at, duration
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(server_content_id) DO UPDATE SET
              lesson_belong=excluded.lesson_belong,
              content_type=excluded.content_type,
              url=excluded.url, 
              title=excluded.title,
              description=excluded.description,
              file_name=excluded.file_name,
              done=excluded.done,
              last_accessed=excluded.last_accessed,
              started_at=excluded.started_at, 
              completed_at=excluded.completed_at,
              duration=excluded.duration;
          `,
          [
            c.content_id,
            localLesson.lesson_id,
            c.content_type || "other",
            c.url || null,
            c.title || "Untitled Content",
            c.description || null,
            c.file_name || null,
            Boolean(c.done),
            c.last_accessed || null,
            c.started_at || null,
            c.completed_at || null,
            c.duration || null,
          ]
        );
      }
    }

    // === 5. Games ===
    if (Array.isArray(data.games)) {
      for (const g of data.games) {
        let localSubjectId = null;
        if (g.subject_id) {
          const subj = await db.getFirstAsync(
            "SELECT subject_id FROM subjects WHERE server_subject_id = ?",
            [g.subject_id]
          );
          localSubjectId = subj?.subject_id || null;
        }

        let localContentId = null;
        if (g.content_id) {
          const cont = await db.getFirstAsync(
            "SELECT content_id FROM subject_contents WHERE server_content_id = ?",
            [g.content_id]
          );
          localContentId = cont?.content_id || null;
        }

        await db.runAsync(
          `INSERT INTO games (
            server_game_id, subject_id, content_id, game_type_id, title, description
          ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(server_game_id) DO UPDATE SET
              subject_id=excluded.subject_id,
              content_id=excluded.content_id,
              game_type_id=excluded.game_type_id,
              title=excluded.title,
              description=excluded.description;
            `,
          [
            g.game_id,
            localSubjectId,
            localContentId,
            g.game_type_id || 1,
            g.title || "Untitled Game",
            g.description || null,
          ]
        );
      }
    }

    // === 6. Notifications ===
    if (Array.isArray(data.notifications)) {
      for (const n of data.notifications) {
        await db.runAsync(
          `INSERT INTO notifications (
            server_notification_id, title, message, type, is_read, created_at, read_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(server_notification_id) DO UPDATE SET
              title=excluded.title,
              message=excluded.message, 
              type=excluded.type, 
              is_read=excluded.is_read, 
              created_at=excluded.created_at, 
              read_at=excluded.read_at;
          `,
          [
            n.notification_id,
            n.title || "Notification",
            n.message || "",
            n.type || "info",
            Boolean(n.is_read),
            n.created_at || new Date().toISOString(),
            n.read_at || null,
          ]
        );
      }
    }

    // === 7. Pupil Test Scores ===
    if (Array.isArray(data.pupil_test_scores)) {
      const localUser = await db.getFirstAsync("SELECT user_id FROM users LIMIT 1");
      if (localUser) {
        for (const score of data.pupil_test_scores) {
          await db.runAsync(
            `INSERT INTO pupil_test_scores (
              server_score_id, pupil_id, test_id, score, max_score, attempt_number, taken_at, grade, is_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(server_score_id) DO UPDATE SET
                pupil_id=excluded.pupil_id,
                test_id=excluded.test_id,
                score=excluded.score,
                max_score=excluded.max_score,
                attempt_number=excluded.attempt_number,
                taken_at=excluded.taken_at,
                grade=excluded.grade,
                is_synced=excluded.is_synced;
            `,
            [
              score.score_id,
              localUser.user_id,
              score.test_id,
              score.score || 0,
              score.max_score || 0,
              score.attempt_number || 1,
              score.taken_at || new Date().toISOString(),
              score.grade || 0,
              score.is_synced ? 1 : 0,
            ]
          );
        }
      }
    }

    // === 8. Pupil Achievements ===
    if (Array.isArray(data.pupil_achievements)) {
      const localUser = await db.getFirstAsync("SELECT user_id FROM users LIMIT 1");
      if (localUser) {
        for (const ach of data.pupil_achievements) {
          await db.runAsync(
            `INSERT INTO pupil_achievements (
              server_achievement_id, server_badge_id, pupil_id, title, description, icon, color, earned_at, subject_content_id, is_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(server_achievement_id, pupil_id) DO UPDATE SET
                server_badge_id=excluded.server_badge_id,
                title=excluded.title,
                description=excluded.description,
                icon=excluded.icon,
                color=excluded.color,
                earned_at=excluded.earned_at,
                subject_content_id=excluded.subject_content_id,
                is_synced=excluded.is_synced;
            `,
            [
              ach.achievement_id,
              ach.badge_id,
              localUser.user_id,
              ach.title,
              ach.description,
              ach.icon,
              ach.color,
              ach.earned_at || new Date().toISOString(),
              ach.subject_content_id,
              ach.is_synced ? 1 : 0,
            ]
          );
        }
      }
    }

    // === 9. Classmates ===
    if (Array.isArray(data.classmates)) {
      for (const c of data.classmates) {
        const section = await db.getFirstAsync(
          "SELECT section_id FROM sections LIMIT 1"
        );
        const sectionId = section?.section_id || null;

        await db.runAsync(
          `INSERT INTO classmates (user_id, classmate_name, section_id) 
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, section_id) DO UPDATE SET
            classmate_name=excluded.classmate_name;
          `,
          [c.user_id, c.full_name, sectionId]
        );
      }
    }

    // === 10. Subjects in Section (AFTER sections + subjects are inserted) ===
    if (Array.isArray(data.subjects_in_section)) {
      for (const sis of data.subjects_in_section) {
        await db.runAsync(
          `INSERT OR IGNORE INTO subjects_in_section 
            (section_belong, subject_id, assigned_at)
          VALUES (
            (SELECT section_id FROM sections WHERE server_section_id = ?),
            (SELECT subject_id FROM subjects WHERE server_subject_id = ?),
            ?
          )
            ON CONFLICT(section_belong, subject_id) DO UPDATE SET
              assigned_at=excluded.assigned_at;
          `,
          [sis.section_belong, sis.subject_id, sis.assigned_at || null]
        );
      }
    }

    await db.execAsync("COMMIT");
    console.log("✅ Sync data saved to SQLite (transaction committed)");
  } catch (error) {
    console.error("❌ Sync failed, rolling back:", error);
    await db.execAsync("ROLLBACK");
    throw error;
  }
}

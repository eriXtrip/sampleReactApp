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
    await db.execAsync(`
      DELETE FROM sections;
      DELETE FROM subjects;
      DELETE FROM subjects_in_section;
      DELETE FROM lessons;
      DELETE FROM subject_contents;
      DELETE FROM games;
      DELETE FROM notifications;
      DELETE FROM pupil_test_scores;
      DELETE FROM pupil_achievements;
      DELETE FROM classmates;
    `);

    // === 1. Sections ===
    if (Array.isArray(data.sections)) {
      for (const s of data.sections) {
        await db.runAsync(
          `INSERT INTO sections (
            server_section_id, teacher_id, teacher_name, section_name, school_year
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            s.section_id,
            s.teacher_id,
            s.teacher_name || "Unknown Teacher",
            s.section_name || "Unnamed Section",
            s.school_year || "",
          ]
        );
      }
    }

    // === 2. Subjects ===
    // === 2. Subjects ===
    if (Array.isArray(data.subjects)) {
      for (const sub of data.subjects) {
        await db.runAsync(
          `INSERT OR IGNORE INTO subjects (
            server_subject_id, subject_name, grade_level, description, is_public
          ) VALUES (?, ?, ?, ?, ?)`,
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
            server_lesson_id, lesson_title, description, subject_belong, quarter
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            l.lesson_id,
            l.lesson_title || "Untitled Lesson",
            l.description || null,
            localSubject.subject_id,
            l.quarter || 1,
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
            server_content_id, lesson_belong, content_type, url, title, description, file_name, downloaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
          [
            c.content_id,
            localLesson.lesson_id,
            c.content_type || "other",
            c.url || null,
            c.title || "Untitled Content",
            c.description || null,
            c.file_name || null,
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
          ) VALUES (?, ?, ?, ?, ?, ?)`,
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
              server_score_id, pupil_id, test_id, score, max_score, attempt_number, taken_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              score.score_id,
              localUser.user_id,
              score.test_id,
              score.score || 0,
              score.max_score || 0,
              score.attempt_number || 1,
              score.taken_at || new Date().toISOString(),
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
              server_achievement_id, pupil_id, earned_at
            ) VALUES (?, ?, ?)`,
            [
              ach.achievement_id,
              localUser.user_id,
              ach.earned_at || new Date().toISOString(),
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
          `INSERT INTO classmates (user_id, classmate_name, section_id) VALUES (?, ?, ?)`,
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
          )`,
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

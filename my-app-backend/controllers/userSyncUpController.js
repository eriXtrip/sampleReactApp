// my-app-backend/controllers/userSyncUpController.js
import pool from '../services/db.js';

export const syncUp = async (req, res) => {
  const userId = req.user.userId;
  const { pupil_test_scores = [], pupil_answers = [], pupil_progress = [], notifications = [] } = req.body;

  const client = await pool.getConnection();
  const insertedScoreIds = [];
  const insertedAnswerIds = [];
  const insertedProgressIds = [];
  const insertedNotificationIds = [];

  try {
    await client.query('START TRANSACTION');

    // =============================
    // 1. SYNC pupil_test_scores
    // =============================
    for (const s of pupil_test_scores) {
      const takenAt = s.taken_at
        ? new Date(s.taken_at).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');

      const [scoreResult] = await client.query(
        `INSERT INTO pupil_test_scores
         (pupil_id, test_id, score, max_score, attempt_number, grade, taken_at, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           score = VALUES(score),
           max_score = VALUES(max_score),
           attempt_number = VALUES(attempt_number),
           grade = VALUES(grade),
           taken_at = VALUES(taken_at),
           is_synced = 1`,
        [
          userId,
          s.test_id,
          s.score,
          s.max_score,
          s.attempt_number || 1,
          s.grade || Math.round((s.score / s.max_score) * 100),
          takenAt
        ]
      );
      insertedScoreIds.push(scoreResult.insertId || null);
    }

    // =============================
    // 2. SYNC pupil_answers
    // =============================
    for (const a of pupil_answers) {
      const answeredAt = a.answered_at
        ? new Date(a.answered_at).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');

      const [answerResult] = await client.query(
        `INSERT INTO pupil_answers
         (pupil_id, question_id, choice_id, answered_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           choice_id = VALUES(choice_id),
           answered_at = VALUES(answered_at)`,
        [
          userId,
          a.question_id,
          a.choice_id,
          answeredAt
        ]
      );
      insertedAnswerIds.push(answerResult.insertId || null);
    }

    // Commit transaction
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sync successful',
      inserted_score_ids: insertedScoreIds,
      inserted_answer_ids: insertedAnswerIds
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Sync-up failed:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message
    });
  } finally {
    client.release();
  }
};

// If you have duration like "0m 11s"
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  if (typeof durationStr !== 'string') return 0; // <-- added check
  const match = durationStr.match(/(\d+)m (\d+)s/);
  if (!match) return 0;
  const minutes = parseInt(match[1]);
  const seconds = parseInt(match[2]);
  return minutes * 60 + seconds;
}

// Sync only pupil_progress
export const syncProgress = async (req, res) => {
  const userId = req.user.userId;
  const { pupil_progress = [], pupil_content_progress = [] } = req.body;

  if (!pupil_progress.length && !pupil_content_progress.length) {
    return res.json({ success: true, message: 'No progress to sync', inserted_progress_ids: [], inserted_content_ids: [] });
  }

  const client = await pool.getConnection();
  const insertedProgressIds = [];
  const insertedContentIds = [];

  try {
    await client.query('START TRANSACTION');

    // ---- Sync lessons progress ----
    for (const p of pupil_progress) {
      const lastAccessed = p.last_accessed
        ? new Date(p.last_accessed).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');

      const completedAt = p.completed_at
        ? new Date(p.completed_at).toISOString().slice(0, 19).replace('T', ' ')
        : null;

      const [result] = await client.query(
        `INSERT INTO pupil_progress
         (pupil_id, lesson_id, status, progress_percent, last_accessed, completed_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           progress_percent = VALUES(progress_percent),
           last_accessed = VALUES(last_accessed),
           completed_at = VALUES(completed_at)`,
        [
          userId,
          p.server_lesson_id,
          p.status,
          p.progress_percent,
          lastAccessed,
          completedAt
        ]
      );

      insertedProgressIds.push(result.insertId || null);
    }

    // ---- Sync content progress ----
    for (const c of pupil_content_progress) {
      const lastAccessed = c.last_accessed
        ? new Date(c.last_accessed).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');

      const startedAt = c.started_at
        ? new Date(c.started_at).toISOString().slice(0, 19).replace('T', ' ')
        : null;

      const completedAt = c.completed_at
        ? new Date(c.completed_at).toISOString().slice(0, 19).replace('T', ' ')
        : null;

      const durationInSeconds = parseDuration(c.duration);

      const [result] = await client.query(
        `INSERT INTO pupil_content_progress
         (pupil_id, content_id, done, last_accessed, started_at, completed_at, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           done = VALUES(done),
           last_accessed = VALUES(last_accessed),
           started_at = VALUES(started_at),
           completed_at = VALUES(completed_at),
           duration = VALUES(duration)`,
        [
          userId,
          c.content_id,
          c.done ? 1 : 0,
          lastAccessed,
          startedAt,
          completedAt,
          durationInSeconds
        ]
      );

      insertedContentIds.push(result.insertId || null);
    }

    await client.query(
     `UPDATE pupil_progress pp
      JOIN (
          SELECT
              sc.lesson_belong AS lesson_id,
              pcp.pupil_id,
              ROUND(SUM(pcp.done) / COUNT(sc.content_id) * 100, 2) AS progress_percent,
              MAX(pcp.last_accessed) AS last_accessed,
              CASE WHEN SUM(pcp.done) = COUNT(sc.content_id) THEN NOW() ELSE NULL END AS completed_at
          FROM pupil_content_progress pcp
          JOIN subject_contents sc ON pcp.content_id = sc.content_id
          WHERE pcp.pupil_id = ?
          GROUP BY sc.lesson_belong, pcp.pupil_id
      ) AS sub ON pp.pupil_id = sub.pupil_id AND pp.lesson_id = sub.lesson_id
      SET
          pp.progress_percent = sub.progress_percent,
          pp.last_accessed = sub.last_accessed,
          pp.completed_at = sub.completed_at,
          pp.status = CASE WHEN sub.progress_percent = 100 THEN 1 ELSE 0 END`,
      [userId]
    );


    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Progress sync successful',
      inserted_progress_ids: insertedProgressIds,
      inserted_content_ids: insertedContentIds
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Progress sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message
    });
  } finally {
    client.release();
  }
};

export const syncAchievements = async (req, res) => {
  const userId = req.user.userId;
  const { pupil_achievements = [] } = req.body;

  if (!pupil_achievements.length) {
    return res.json({ success: true, message: 'No achievements to sync', inserted_achievement_ids: [] });
  }

  const client = await pool.getConnection();
  const insertedAchievementIds = [];

  try {
    await client.query('START TRANSACTION');

    for (const a of pupil_achievements) {
      const earnedAt = a.earned_at
        ? new Date(a.earned_at).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');
    

      const [result] = await client.query(
        `INSERT INTO pupil_achievements
         (pupil_id, badge_id, achievement_id, earned_at, is_synced)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           earned_at = VALUES(earned_at)`,
        [
          userId,
          a.server_badge_id,
          a.server_achievement_id,
          earnedAt
        ]
      );

      insertedAchievementIds.push(result.insertId || null);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Achievements sync successful',
      inserted_achievement_ids: insertedAchievementIds
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Achievements sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message
    });
  } finally {
    client.release();
  }
};


export const syncNotification = async (req, res) => {
  const userId = req.user.userId;
  const { notifications = [] } = req.body;

  // console.log('📩 Received notifications from client:', JSON.stringify(notifications, null, 2));

  if (!notifications.length) {
    return res.json({ success: true, inserted_notification_ids: [] });
  }

  const client = await pool.getConnection();
  const insertedNotificationIds = []; // Only for newly created ones

  try {
    await client.query('START TRANSACTION');

    for (const n of notifications) {
      const createdAt = n.created_at
        ? new Date(n.created_at).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');

      const readAt = n.is_read && n.read_at
        ? new Date(n.read_at).toISOString().slice(0, 19).replace('T', ' ')
        : (n.is_read ? createdAt : null);

      if (!n.notification_id) {
        // INSERT new notification (created offline)
        const [result] = await client.query(
          `INSERT INTO notifications
            (user_id, type, title, message, is_read, created_at, read_at, is_synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            userId,
            n.type || 'info',
            n.title,
            n.message,
            n.is_read ? 1 : 0,
            createdAt,
            readAt
          ]
        );
        insertedNotificationIds.push(result.insertId);
      } else {
        // UPDATE existing notification (usually just read status)
        await client.query(
          `UPDATE notifications
           SET is_read = ?,
               read_at = ?,
               is_synced = TRUE
           WHERE notification_id = ? AND user_id = ?`,
          [
            n.is_read ? 1 : 0,
            readAt,
            n.notification_id,
            userId
          ]
        );
        insertedNotificationIds.push(n.notification_id); // keep order consistent
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sync successful',
      inserted_notification_ids: insertedNotificationIds
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Notifications sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message
    });
  } finally {
    client.release();
  }
};


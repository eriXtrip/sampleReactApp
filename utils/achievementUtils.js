import { 
  showLoadingToast, 
  dismissLoadingToast,
  triggerLocalNotification,
  showSuccessToast,
  showErrorToast
} from './notificationUtils';

import { safeExec, safeGetAll, safeRun, safeGetFirst, enableWAL } from './dbHelpers';

export async function saveAchievementAndUpdateContent(db, gameBadge, content_id, inizialized) {
    console.log("Saving Achievement and Updating Content:", { gameBadge, content_id });
  if(!inizialized) return;
  try {
    // get current user_id
    const userRow = await safeGetFirst(db, `SELECT user_id FROM users LIMIT 1`);
    if (!userRow) {
      console.warn("No user found in users table.");
      return;
    }
    const pupilId = userRow.user_id;

    if (db) {
      await enableWAL(db);
    }

    // Insert earned achievement
    await safeRun(
      db,
      `INSERT OR IGNORE INTO pupil_achievements 
        (server_badge_id, pupil_id, title, description, icon, color, earned_at, subject_content_id)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
      [
        gameBadge?.id,
        pupilId,
        gameBadge?.title,
        gameBadge?.subtext,
        gameBadge?.icon,
        gameBadge?.color,
        content_id
      ]
    );

    // Insert earned achievement
    await safeRun(
      db,
      `INSERT OR IGNORE INTO notifications 
        (title, message, type, created_at)
      VALUES ('Badge Earn', ?, 'achievement_badge', datetime('now'))`,
      [gameBadge?.title]
    );

    
    // Update subject_contents
    await safeRun(
      db,
      `UPDATE subject_contents 
       SET done = 1, 
           last_accessed = datetime('now'), 
           completed_at = datetime('now') 
       WHERE content_id = ?`,
      [content_id]
    );

    console.log("✅ Achievement saved and subject_contents updated.");
    showSuccessToast('Badge recieved!', `You earn ${gameBadge.title}!`);

  } catch (err) {
    console.error("❌ Failed to save achievement/update content:", err);
  }
}

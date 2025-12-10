import { 
  showLoadingToast, 
  dismissLoadingToast,
  triggerLocalNotification,
  showSuccessToast,
  showErrorToast
} from './notificationUtils';

import { safeExec, safeGetAll, safeRun, safeGetFirst, enableWAL } from './dbHelpers';
import { waitForDb } from './dbWaiter';

export async function saveAchievementAndUpdateContent(db, gameBadge, content_id, inizialized) {
  console.log("Saving Achievement and Updating Content:", { gameBadge, content_id });
  const activeDB = await waitForDb(db, inizialized);
  try {
    // get current user_id
    const userRow = await safeGetFirst(activeDB `SELECT user_id FROM users LIMIT 1`);
    if (!userRow) {
      console.warn("No user found in users table.");
      return;
    }
    const pupilId = userRow.user_id;

    if (activeDB) {
      await enableWAL(activeDB);
    }

    // Insert earned achievement
    await safeRun(
      activeDB
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
      activeDB
      `INSERT OR IGNORE INTO notifications 
        (title, message, type, created_at)
      VALUES ('Badge Earn', ?, 'achievement_badge', datetime('now'))`,
      [gameBadge?.title]
    );

    
    // Update subject_contents
    await safeRun(
      activeDB
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

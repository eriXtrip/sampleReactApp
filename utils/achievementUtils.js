export async function saveAchievementAndUpdateContent(db, gameBadge, content_id) {
    console.log("Saving Achievement and Updating Content:", { gameBadge, content_id });
  try {
    // get current user_id
    const userRow = await db.getFirstAsync(`SELECT user_id FROM users LIMIT 1`);
    if (!userRow) {
      console.warn("No user found in users table.");
      return;
    }
    const pupilId = userRow.user_id;

    // Insert earned achievement
    await db.runAsync(
      `INSERT OR IGNORE INTO pupil_achievements 
        (server_achievement_id, pupil_id, title, description, icon, color, earned_at, subject_content_id)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
      [
        gameBadge?.id || null,
        pupilId,
        gameBadge?.title || "Badge",
        gameBadge?.subtext || null,
        gameBadge?.icon || "trophy",
        gameBadge?.color || "#FFD700",
        content_id
      ]
    );

    // Update subject_contents
    await db.runAsync(
      `UPDATE subject_contents 
       SET done = 1, 
           last_accessed = datetime('now'), 
           completed_at = datetime('now') 
       WHERE content_id = ?`,
      [content_id]
    );

    console.log("✅ Achievement saved and subject_contents updated.");
  } catch (err) {
    console.error("❌ Failed to save achievement/update content:", err);
  }
}

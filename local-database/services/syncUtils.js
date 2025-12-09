// local-database/services/syncUtils.js

import { safeRun } from "../../utils/dbHelpers";
export async function markUnsynced(db, tableName, localId) {
  try {
    await safeRun(
      db,
      `UPDATE ${tableName} SET is_synced = 0, synced_at = NULL WHERE rowid = ?`,
      [localId]
    );
    console.log(`Marked ${tableName} (rowid: ${localId}) as unsynced`);
  } catch (error) {
    console.error(`Failed to mark ${tableName} as unsynced:`, error);
  }
}
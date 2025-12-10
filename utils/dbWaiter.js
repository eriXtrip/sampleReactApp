/**
 * Waits for the SQLite database to be ready.
 * @param {object|null} db - Database instance
 * @param {boolean} initialized - DB initialized flag
 * @param {number} interval - Polling interval in ms (default: 50)
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @returns {Promise<object>} - Resolves with the db instance
 */
export async function waitForDb(db, initialized, interval = 50, timeout = 5000) {
  const start = Date.now();
  while (!db || !initialized) {
    if (Date.now() - start > timeout) {
      throw new Error("DB not ready after 5s");
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return db;
}

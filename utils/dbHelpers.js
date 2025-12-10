// dbHelpers.js
import { dbMutex } from "./databaseMutex";
import { initializeDatabase } from "../local-database/services/database";

/**
 * Enable WAL to prevent database locking in release builds.
 * Call once when initializing the DB.
 */
export async function enableWAL(db) {
  try {
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA synchronous = NORMAL;");
    await db.execAsync("PRAGMA temp_store = MEMORY;");
    await db.execAsync("PRAGMA cache_size = -20000;");
    console.log("🟢 SQLite WAL mode enabled");
  } catch (err) {
    console.warn("⚠️ WAL enable failed:", err.message);
  }
}

/* --------------------------- HELPER: Retry with DB reinit --------------------------- */
async function runWithDbRetry(fn, db, ...args) {
  let retried = false;
  while (true) {
    try {
      return await fn(db, ...args, retried);
    } catch (err) {
      if (!retried) {
        console.warn("⚠️ SQLite fatal error detected, reinitializing DB...", err);
        retried = true;
        await initializeDatabase(db);
        await enableWAL(db);
        continue; // retry the same operation once
      }
      throw err; // already retried → throw
    }
  }
}

/* ---------------------------------------------------------------
   SAFE RUN — single SQL statement
--------------------------------------------------------------- */
export async function safeRun(db, sql, params = [], timeout = 30000, hasRetried = false) {
  await dbMutex.acquire("db", timeout);
  try {
    return await db.runAsync(sql, params);
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE SELECT (multiple rows)
--------------------------------------------------------------- */
export async function safeGetAll(db, sql, params = [], timeout = 30000, hasRetried = false) {
  await dbMutex.acquire("db", timeout);
  try {
    return await db.getAllAsync(sql, params);
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE SELECT (first row only)
--------------------------------------------------------------- */
export async function safeGetFirst(db, sql, params = [], timeout = 30000, hasRetried = false) {
  await dbMutex.acquire("db", timeout);
  try {
    return await db.getFirstAsync(sql, params);
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE EXEC — multiple SQL statements in one transaction
--------------------------------------------------------------- */
export async function safeExec(db, sql, timeout = 30000, hasRetried = false) {
  await dbMutex.acquire("db", timeout);
  try {
    await db.execAsync("BEGIN IMMEDIATE;");
    const result = await db.execAsync(sql);
    await db.execAsync("COMMIT;");
    return result;
  } catch (err) {
    try { await db.execAsync("ROLLBACK;"); } catch(e) { console.error("Rollback failed:", e); }
    throw err;
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE EXECUTE MANY — array of separate SQL statements
--------------------------------------------------------------- */
export async function safeExecMany(db, statements = [], timeout = 30000, hasRetried = false) {
  if (!statements.length) return;

  await dbMutex.acquire("db", timeout);
  try {
    await db.execAsync("BEGIN IMMEDIATE;");
    for (const { sql, params } of statements) {
      await db.runAsync(sql, params ?? []);
    }
    await db.execAsync("COMMIT;");
  } catch (err) {
    try { await db.execAsync("ROLLBACK;"); } catch(e) { console.error("Rollback failed:", e); }
    throw err;
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* --------------------------- EXPORT WITH AUTO-RETRY --------------------------- */
export default {
  enableWAL,
  safeRun: (db, sql, params, timeout) => runWithDbRetry(safeRun, db, sql, params, timeout),
  safeGetAll: (db, sql, params, timeout) => runWithDbRetry(safeGetAll, db, sql, params, timeout),
  safeGetFirst: (db, sql, params, timeout) => runWithDbRetry(safeGetFirst, db, sql, params, timeout),
  safeExec: (db, sql, timeout) => runWithDbRetry(safeExec, db, sql, timeout),
  safeExecMany: (db, statements, timeout) => runWithDbRetry(safeExecMany, db, statements, timeout),
};

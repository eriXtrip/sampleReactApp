// dbHelpers.js
import { dbMutex } from "./databaseMutex";

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

/* ---------------------------------------------------------------
   SAFE RUN — for single SQL statements (INSERT / UPDATE / DELETE)
   --------------------------------------------------------------- */
export async function safeRun(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire("db", timeout);
  try {
    return await db.runAsync(sql, params);
  } catch (err) {
    console.error("❌ safeRun SQL ERROR:", err);
    throw err;
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE SELECT (multiple rows)
   --------------------------------------------------------------- */
export async function safeGetAll(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire("db", timeout);
  try {
    return await db.getAllAsync(sql, params);
  } catch (err) {
    console.error("❌ safeGetAll ERROR:", err);
    throw err;
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE SELECT (first row only)
   --------------------------------------------------------------- */
export async function safeGetFirst(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire("db", timeout);
  try {
    return await db.getFirstAsync(sql, params);
  } catch (err) {
    console.error("❌ safeGetFirst ERROR:", err);
    throw err;
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE EXEC — for batching MULTIPLE SQL statements in one transaction
   (ex: clearing tables, seeding data, syncing chunks)
   --------------------------------------------------------------- */
export async function safeExec(db, sql, timeout = 30000) {
  await dbMutex.acquire("db", timeout);

  try {
    await db.execAsync("BEGIN IMMEDIATE;");   // prevents concurrent writes

    const result = await db.execAsync(sql);  // executes all statements

    await db.execAsync("COMMIT;");
    return result;

  } catch (err) {
    console.error("❌ safeExec ERROR → ROLLBACK", err);
    try { await db.execAsync("ROLLBACK;"); } catch (e2) {
      console.error("❌ Rollback failed:", e2);
    }
    throw err;

  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

/* ---------------------------------------------------------------
   SAFE EXECUTE MANY — array of separate SQL statements
   (each statement is run in a single large transaction)
   --------------------------------------------------------------- */
export async function safeExecMany(db, statements = [], timeout = 30000) {
  await dbMutex.acquire("db", timeout);

  try {
    await db.execAsync("BEGIN IMMEDIATE;");

    for (const { sql, params } of statements) {
      await db.runAsync(sql, params ?? []);
    }

    await db.execAsync("COMMIT;");
  } catch (err) {
    console.error("❌ safeExecMany ERROR → ROLLBACK", err);
    try { await db.execAsync("ROLLBACK;"); } catch {}
    throw err;
  } finally {
    try { dbMutex.release("db"); } catch {}
  }
}

export default {
  enableWAL,
  safeRun,
  safeGetAll,
  safeGetFirst,
  safeExec,
  safeExecMany,
};

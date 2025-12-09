import { dbMutex } from './databaseMutex';

/**
 * Run a SQL statement inside a transaction with mutex
 */
export async function safeRun(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    await db.runAsync("BEGIN TRANSACTION;");
    const result = await db.runAsync(sql, params);
    await db.runAsync("COMMIT;");
    return result;
  } catch (err) {
    console.error("❌ SQL ERROR → ROLLBACK", err);
    try { await db.runAsync("ROLLBACK;"); } catch (rollbackErr) {
      console.error("❌ Rollback failed:", rollbackErr);
    }
    throw err;
  } finally {
    try { dbMutex.release('db'); } catch (e) { console.error('Error releasing db mutex', e); }
  }
}

/**
 * Safe SELECT for multiple rows
 */
export async function safeGetAll(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    return await db.getAllAsync(sql, params);
  } finally {
    try { dbMutex.release('db'); } catch (e) { console.error('Error releasing db mutex', e); }
  }
}

/**
 * Safe SELECT for single row
 */
export async function safeGetFirst(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    return await db.getFirstAsync(sql, params);
  } finally {
    try { dbMutex.release('db'); } catch (e) { console.error('Error releasing db mutex', e); }
  }
}

/**
 * Safe execution of multiple statements
 */
export async function safeExec(db, sql, timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    await db.runAsync("BEGIN TRANSACTION;");
    const result = await db.runAsync(sql);
    await db.runAsync("COMMIT;");
    return result;
  } catch (err) {
    console.error("❌ SQL EXEC ERROR → ROLLBACK", err);
    try { await db.runAsync("ROLLBACK;"); } catch (rollbackErr) {
      console.error("❌ Rollback failed:", rollbackErr);
    }
    throw err;
  } finally {
    try { dbMutex.release('db'); } catch (e) { console.error('Error releasing db mutex', e); }
  }
}

export default {
  safeRun,
  safeGetAll,
  safeGetFirst,
  safeExec,
};

import { dbMutex } from './databaseMutex';

/**
 * Small helper wrappers that serialize access to the SQLite instance
 * by using the existing `dbMutex`. Keep transactions short.
 */
export async function safeRun(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    return await db.runAsync(sql, params);
  } finally {
    try { dbMutex.release('db'); } catch (e) { console.error('Error releasing db mutex', e); }
  }
}

export async function safeGetAll(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    return await db.getAllAsync(sql, params);
  } finally {
    try { dbMutex.release('db'); } catch (e) { console.error('Error releasing db mutex', e); }
  }
}

export async function safeGetFirst(db, sql, params = [], timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    return await db.getFirstAsync(sql, params);
  } finally {
    try { dbMutex.release('db'); } catch (e) { console.error('Error releasing db mutex', e); }
  }
}

export async function safeExec(db, sql, timeout = 30000) {
  await dbMutex.acquire('db', timeout);
  try {
    return await db.execAsync(sql);
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

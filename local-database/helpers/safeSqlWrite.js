// local-database/helpers/safeSqlWrite.js

export async function safeSqlWrite(db, callback) {
  try {
    await db.execAsync("BEGIN TRANSACTION;");
    await callback(db);
    await db.execAsync("COMMIT;");
  } catch (err) {
    console.log("❌ SQL WRITE ERROR → ROLLBACK", err);
    await db.execAsync("ROLLBACK;");
    throw err;
  }
}

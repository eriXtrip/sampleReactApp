// services/dbReady.js
let _dbInitialized = false;

export function markDbInitialized() {
  _dbInitialized = true;
  console.log('Database initialized → ready for operations');
}

export function isDbReady() {
  return _dbInitialized;
}

/**
 * Waits until DB is ready, with optional timeout
 */
export async function waitForDbReady(timeout = 5000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (_dbInitialized) return resolve(true);

      if (Date.now() - start > timeout) return reject(new Error('DB not initialized within timeout'));

      setTimeout(check, 100); // check every 100ms
    };

    check();
  });
}

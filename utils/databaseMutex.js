// utils/databaseMutex.js
class DatabaseMutex {
  constructor() {
    this.locks = new Map();
    this.waiters = new Map(); // Queue for waiting tasks
  }

  /**
   * Acquire a lock with timeout and queue management
   * @param {string} resource - Resource identifier
   * @param {number} timeout - Timeout in milliseconds (default: 30s)
   */
  async acquire(resource, timeout = 30000) {
    const startTime = Date.now();
    
    // If lock doesn't exist, acquire it immediately
    if (!this.locks.has(resource)) {
      this.locks.set(resource, {
        owner: Math.random(),
        acquiredAt: Date.now(),
      });
      return;
    }

    // Otherwise, wait in queue
    const waiters = this.waiters.get(resource) || [];
    const deferred = {};
    const promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
      deferred.timeout = setTimeout(() => {
        // Remove from queue if timeout
        const idx = waiters.indexOf(deferred);
        if (idx !== -1) waiters.splice(idx, 1);
        reject(new Error(`Mutex acquire timeout for resource: ${resource}`));
      }, timeout);
    });

    waiters.push(deferred);
    this.waiters.set(resource, waiters);

    try {
      await promise;
      // Successfully acquired
      this.locks.set(resource, {
        owner: Math.random(),
        acquiredAt: Date.now(),
      });
    } catch (err) {
      console.error(`❌ Mutex timeout acquiring ${resource}:`, err.message);
      throw err;
    }
  }

  /**
   * Release lock and wake up next waiter
   */
  release(resource) {
    const waiters = this.waiters.get(resource) || [];
    
    if (waiters.length > 0) {
      // Wake up first waiter
      const next = waiters.shift();
      clearTimeout(next.timeout);
      next.resolve();
    } else {
      // No waiters, just delete the lock
      this.locks.delete(resource);
    }
  }

  /**
   * Force release (for cleanup on app suspend)
   */
  forceRelease(resource) {
    this.locks.delete(resource);
    const waiters = this.waiters.get(resource) || [];
    waiters.forEach(w => {
      clearTimeout(w.timeout);
      w.reject(new Error('Mutex force released (app suspended)'));
    });
    this.waiters.delete(resource);
  }

  /**
   * Check if resource is locked
   */
  isLocked(resource) {
    return this.locks.has(resource);
  }

  /**
   * Clear all locks (emergency cleanup)
   */
  clearAll() {
    this.locks.clear();
    this.waiters.forEach(waiters => {
      waiters.forEach(w => {
        clearTimeout(w.timeout);
        w.reject(new Error('Mutex cleared'));
      });
    });
    this.waiters.clear();
  }
}

export const dbMutex = new DatabaseMutex(); 
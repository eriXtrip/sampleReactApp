// utils/databaseMutex.js
class DatabaseMutex {
  constructor() {
    this.locks = new Map();
  }

  async acquire(resource) {
    while (this.locks.has(resource)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.locks.set(resource, true);
  }

  release(resource) {
    this.locks.delete(resource);
  }
}

export const dbMutex = new DatabaseMutex(); 
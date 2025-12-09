// utils/appLifecycleManager.js
import { AppState } from 'react-native';
import { dbMutex } from './databaseMutex';

/**
 * Manages app lifecycle events (pause, resume, destroy)
 * Ensures database operations are safely interrupted during background
 */
class AppLifecycleManager {
  constructor() {
    this.appState = AppState.currentState;
    this.listeners = [];
    this.isInitialized = false;
    this.dbInstance = null;
    this.syncInProgress = false;
  }

  /**
   * Initialize with database instance
   */
  initialize(dbInstance) {
    if (this.isInitialized) return;
    
    this.dbInstance = dbInstance;
    this.isInitialized = true;

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    
    console.log('✅ AppLifecycleManager initialized');
    
    return () => subscription.remove();
  }

  /**
   * Handle app state changes
   */
  handleAppStateChange = async (nextAppState) => {
    const previousState = this.appState;
    this.appState = nextAppState;

    console.log(`📱 App State: ${previousState} → ${nextAppState}`);

    if (previousState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      console.log('🟢 App came to foreground');
      await this.onAppForeground();
    } else if (nextAppState.match(/inactive|background/)) {
      // App is going to background
      console.log('🔴 App going to background');
      await this.onAppBackground();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(nextAppState));
  };

  /**
   * Called when app comes to foreground
   */
  onAppForeground = async () => {
    try {
      // Release any stuck locks with timeout
      dbMutex.forceRelease('sync');
      console.log('🔓 Released any stuck mutex locks');

      // Verify database is still valid
      if (this.dbInstance) {
        try {
          await this.dbInstance.getFirstAsync('SELECT 1');
          console.log('✅ Database connection verified');
        } catch (err) {
          console.error('❌ Database connection lost, may need reinitialize:', err.message);
        }
      }
    } catch (err) {
      console.error('❌ Error on app foreground:', err);
    }
  };

  /**
   * Called when app goes to background
   */
  onAppBackground = async () => {
    try {
      // Wait a bit for any pending operations
      const timeout = new Promise(resolve => setTimeout(resolve, 500));
      
      // If sync is in progress, wait up to 500ms for it to finish
      if (this.syncInProgress) {
        console.log('⏳ Waiting for sync to complete before background...');
        await Promise.race([
          new Promise(resolve => {
            const check = setInterval(() => {
              if (!this.syncInProgress) {
                clearInterval(check);
                resolve();
              }
            }, 50);
            setTimeout(() => clearInterval(check), timeout);
          }),
          timeout
        ]);
      }

      // Release locks to prevent hanging
      dbMutex.forceRelease('sync');
      console.log('🔓 Forcefully released sync lock for background');

    } catch (err) {
      console.error('❌ Error on app background:', err);
      // Even on error, make sure to release locks
      dbMutex.forceRelease('sync');
    }
  };

  /**
   * Register a listener for app state changes
   */
  onStateChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Mark sync as in progress
   */
  markSyncStart() {
    this.syncInProgress = true;
    console.log('▶️ Sync marked as in-progress');
  }

  /**
   * Mark sync as completed
   */
  markSyncEnd() {
    this.syncInProgress = false;
    console.log('⏹️ Sync marked as complete');
  }

  /**
   * Check if app is in background
   */
  isInBackground() {
    return this.appState.match(/inactive|background/) !== null;
  }

  /**
   * Get current app state
   */
  getAppState() {
    return this.appState;
  }
}

export const appLifecycleManager = new AppLifecycleManager();

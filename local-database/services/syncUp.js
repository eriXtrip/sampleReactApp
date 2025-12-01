// local-database/services/syncUp.js
import { getApiUrl } from '../../utils/apiManager.js';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { saveSyncDataToSQLite  } from '../../local-database/services/syncService.js';
import { dbMutex } from '../../utils/databaseMutex.js';


// ===============================
// 🔥 Background Sync Queue System
// ===============================
let syncQueue = [];
let isSyncing = false;

// Remove retryCount from global scope - make it per-task
const MAX_RETRIES = 3;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function runSyncQueue(db) {
  if (isSyncing) {
    console.log("⏳ Sync already in progress, skipping...");
    return;
  }
  
  if (!syncQueue.length) {
    console.log("📭 Sync queue is empty");
    return;
  }

  isSyncing = true;
  
  // Create a copy of the queue to process
  const queueToProcess = [...syncQueue];
  syncQueue = []; // Clear the main queue

  console.log(`🔄 Processing ${queueToProcess.length} sync tasks...`);

  for (const task of queueToProcess) {
    let retryCount = 0;
    let success = false;

    while (retryCount <= MAX_RETRIES && !success) {
      try {
        console.log(`▶ Running sync task: ${task.name} (attempt ${retryCount + 1})`);
        await task.fn(db);
        console.log(`✅ Sync task completed: ${task.name}`);
        success = true;
        
      } catch (err) {
        retryCount++;
        console.error(`❌ Sync task failed: ${task.name} (attempt ${retryCount})`, err);

        if (retryCount <= MAX_RETRIES) {
          const backoff = 2000 * retryCount; // 2s, 4s, 6s
          console.log(`⟳ Retrying ${task.name} in ${backoff / 1000}s...`);
          await delay(backoff);
        } else {
          console.log(`⛔ Max retries reached for ${task.name}. Moving to next task.`);
          // Optionally re-queue the failed task for next sync cycle
          syncQueue.push(task);
        }
      }
    }
  }

  isSyncing = false;
  console.log("🎯 Sync queue processing completed");
}

let isDbInitialized = false;

export function markDbInitialized() {
  isDbInitialized = true;
  console.log('Database initialized → sync enabled');
}

export async function syncTestScoresToServer(db) {
  if (!db || !isDbInitialized) return false;

  const net = await NetInfo.fetch();
  if (!net.isConnected) return false;

  try {
    const API_URL = await getApiUrl();
    const token = await SecureStore.getItemAsync('authToken');

    const user = await db.getFirstAsync(`
      SELECT server_id FROM users WHERE server_id IS NOT NULL LIMIT 1
    `);

    if (!user?.server_id) return false;

    // ---- Get unsynced test scores ----
    const unsyncedScores = await db.getAllAsync(`
      SELECT rowid, test_id, score, max_score, grade, attempt_number, taken_at
      FROM pupil_test_scores 
      WHERE is_synced = 0
    `);

    // ---- Get unsynced pupil answers ----
    const unsyncedAnswers = await db.getAllAsync(`
      SELECT rowid, question_id, choice_id, synced_at
      FROM pupil_answers
      WHERE is_synced = 0
    `);

    const res = await fetch(`${API_URL}/user/sync-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        pupil_test_scores: unsyncedScores.map(s => ({
          test_id: s.test_id,
          score: s.score,
          max_score: s.max_score,
          attempt_number: s.attempt_number,
          taken_at: s.taken_at
        })),
        pupil_answers: unsyncedAnswers.map(a => ({
          question_id: a.question_id,
          choice_id: a.choice_id,
          answered_at: a.synced_at
        }))
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const {
      inserted_score_ids = [],
      inserted_answer_ids = []
    } = await res.json();

    // ---- Update synced test scores ----
    for (let i = 0; i < unsyncedScores.length; i++) {
      await db.runAsync(
        `UPDATE pupil_test_scores
         SET server_score_id = ?, is_synced = 1, synced_at = datetime('now')
         WHERE rowid = ?`,
        [inserted_score_ids[i] || null, unsyncedScores[i].rowid]
      );
    }

    // ---- Update synced answers ----
    for (let i = 0; i < unsyncedAnswers.length; i++) {
      await db.runAsync(
        `UPDATE pupil_answers
         SET server_answer_id = ?, is_synced = 1, synced_at = datetime('now')
         WHERE rowid = ?`,
        [inserted_answer_ids[i] || null, unsyncedAnswers[i].rowid]
      );
    }

    console.log(`Synced: ${unsyncedScores.length} scores, ${unsyncedAnswers.length} answers`);
    return true;

  } catch (err) {
    console.error('Sync error:', err);
    return false;
  }
}

export async function syncNotifications(db) {
  if (!db || !isDbInitialized) return false;
  const net = await NetInfo.fetch();
  if (!net.isConnected) return false;

  try {
    const API_URL = await getApiUrl();
    const token = await SecureStore.getItemAsync('authToken');
    const user = await db.getFirstAsync(`
      SELECT server_id FROM users WHERE server_id IS NOT NULL LIMIT 1
    `);
    if (!user?.server_id) return false;

    // Get ALL local changes: new notifications OR read status updates
    const localChanges = await db.getAllAsync(`
      SELECT 
        rowid,
        server_notification_id,
        type, title, message,
        is_read,
        created_at,
        read_at
      FROM notifications
      WHERE is_synced = 0                          -- new notifications
         OR (server_notification_id IS NOT NULL 
             AND is_read = 1 
             AND read_at IS NOT NULL)              -- read status changed
    `);

    if (!localChanges.length) return true;

    const res = await fetch(`${API_URL}/user/sync-up-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        notifications: localChanges.map(n => ({
          notification_id: n.server_notification_id || null,  // null = new
          type: n.type,
          title: n.title,
          message: n.message,
          is_read: n.is_read === 1,
          created_at: n.created_at,
          read_at: n.read_at
        }))
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const { inserted_notification_ids = [] } = await res.json();

    // Update local DB
    let insertIdIndex = 0;
    for (const change of localChanges) {
      if (!change.server_notification_id) {
        // This was a new notification → assign server ID
        const newServerId = inserted_notification_ids[insertIdIndex++] || null;
        await db.runAsync(`
          UPDATE notifications
          SET server_notification_id = ?, is_synced = 1, synced_at = datetime('now')
          WHERE rowid = ?
        `, [newServerId, change.rowid]);
      } else {
        // Already existed → just mark as synced (read status already sent)
        await db.runAsync(`
          UPDATE notifications
          SET is_synced = 1, synced_at = datetime('now')
          WHERE rowid = ?
        `, [change.rowid]);
      }
    }

    console.log(`Synced ${localChanges.length} notification(s) (creates + reads)`);
    return true;
  } catch (err) {
    console.error('Notifications sync error:', err);
    return false;
  }
}

export async function syncProgressToServer(db) {
  if (!db || !isDbInitialized) {
    console.log('❌ DB not initialized or null → cannot sync progress');
    return false;
  }

  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    console.log('❌ No internet connection → cannot sync progress');
    return false;
  }

  try {
    const API_URL = await getApiUrl();
    const token = await SecureStore.getItemAsync('authToken');

    const user = await db.getFirstAsync(`
      SELECT server_id FROM users WHERE server_id IS NOT NULL LIMIT 1
    `);

    if (!user?.server_id) {
      console.log('❌ No server_id found for user → cannot sync progress');
      return false;
    }

    console.log('🔹 Fetching unsynced progress...');

    // ---- Get unsynced lessons progress ----
    const unsyncedLessonProgress = await db.getAllAsync(`
      SELECT server_lesson_id, lesson_id, status, progress, last_accessed, completed_at
      FROM lessons
      WHERE is_synced = 0
    `);
    console.log(`📘 Unsynced lessons progress: ${unsyncedLessonProgress.length} rows`);

    // ---- Get unsynced content progress ----
    const unsyncedContentProgress = await db.getAllAsync(`
      SELECT content_id, done, last_accessed, started_at, completed_at, duration
      FROM subject_contents
      WHERE is_synced = 0
    `);
    console.log(`📗 Unsynced content progress: ${unsyncedContentProgress.length} rows`);

    if (!unsyncedLessonProgress.length && !unsyncedContentProgress.length) {
      console.log('✅ No unsynced progress found');
      return true;
    }

    console.log('🔹 Sending progress data to server...');
    const res = await fetch(`${API_URL}/user/sync-up-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        pupil_progress: unsyncedLessonProgress,
        pupil_content_progress: unsyncedContentProgress
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const { inserted_progress_ids = [], inserted_content_ids = [] } = await res.json();

    // ---- Mark lessons progress synced locally ----
    for (let i = 0; i < unsyncedLessonProgress.length; i++) {
      await db.runAsync(`
        UPDATE lessons
        SET is_synced = 1, synced_at = datetime('now')
        WHERE rowid = ?
      `, [unsyncedLessonProgress[i].rowid]);
    }

    // ---- Mark content progress synced locally ----
    for (let i = 0; i < unsyncedContentProgress.length; i++) {
      await db.runAsync(`
        UPDATE subject_contents
        SET is_synced = 1, synced_at = datetime('now')
        WHERE content_id = ?
      `, [unsyncedContentProgress[i].content_id]);
    }

    console.log(`✅ Successfully synced ${unsyncedLessonProgress.length} lessons and ${unsyncedContentProgress.length} content progress rows`);
    return true;

  } catch (err) {
    console.error('❌ Progress sync error:', err);
    return false;
  }
}

export async function syncAchievements(db) {
  if (!db || !isDbInitialized) {
    console.log('❌ DB not initialized → cannot sync achievements');
    return false;
  }

  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    console.log('❌ No internet connection → cannot sync achievements');
    return false;
  }

  try {
    const API_URL = await getApiUrl();
    const token = await SecureStore.getItemAsync('authToken');

    // Get the first user with server_id
    const user = await db.getFirstAsync(`
      SELECT server_id FROM users WHERE server_id IS NOT NULL LIMIT 1
    `);

    if (!user?.server_id) {
      console.log('❌ No server_id found → cannot sync achievements');
      return false;
    }

    // Get unsynced achievements
    const unsyncedAchievements = await db.getAllAsync(`
      SELECT pupil_id, server_badge_id, server_achievement_id, earned_at
      FROM pupil_achievements
      WHERE is_synced = 0
    `);

    if (!unsyncedAchievements.length) {
      console.log('✅ No unsynced achievements found');
      return true;
    }

    console.log(`🔹 Syncing ${unsyncedAchievements.length} achievements...`);

    const res = await fetch(`${API_URL}/user/sync-up-achievements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        pupil_achievements: unsyncedAchievements.map(a => ({
          server_badge_id: a.server_badge_id,
          server_achievement_id: a.server_achievement_id,
          earned_at: a.earned_at
        }))
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const { inserted_achievement_ids = [] } = await res.json();

    // Mark local achievements as synced
    for (let i = 0; i < unsyncedAchievements.length; i++) {
      await db.runAsync(
        `UPDATE pupil_achievements
         SET is_synced = 1, synced_at = datetime('now')
         WHERE id = ?`,
        [unsyncedAchievements[i].id]
      );
    }

    console.log(`✅ Successfully synced ${unsyncedAchievements.length} achievements`);
    return true;

  } catch (err) {
    console.error('❌ Achievements sync error:', err);
    return false;
  }
}


export async function triggerSyncIfOnline(db, flags = {}) {
  if (!db) return;
  if (!isDbInitialized) return;

  const { isOffline, isReachable, isApiLoaded } = flags;

  if (!isApiLoaded || isOffline || !isReachable) {
    console.log("⛔ Sync blocked → not online or API unreachable");
    return;
  }

  // 🔍 Comprehensive user and auth check
  try {
    // Check if user exists in local database
    const user = await db.getFirstAsync(`
      SELECT user_id, server_id FROM users LIMIT 1
    `);
    
    if (!user) {
      console.log("⛔ Sync blocked → no user found in database");
      return;
    }
    
    // Check if user has server_id (logged in to server)
    if (!user.server_id) {
      console.log("⛔ Sync blocked → user exists but no server_id (not logged in)");
      return;
    }
    
    // Check if auth token exists
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      console.log("⛔ Sync blocked → no auth token found");
      return;
    }
    
    console.log("👤 User authenticated → proceeding with sync", { 
      user_id: user.user_id, 
      server_id: user.server_id 
    });
    
  } catch (error) {
    console.error("❌ Error during user/auth check:", error);
    return;
  }

  console.log("🌐 Online & API reachable → Starting sync...");

  // Acquire mutex for entire sync operation
  await dbMutex.acquire('sync');

  try {
    // Queue tasks
    syncQueue.push(
      { name: "syncTestScores", fn: syncTestScoresToServer },
      { name: "syncProgress", fn: syncProgressToServer },
      { name: "syncAchievements", fn: syncAchievements },
      { name: "syncNotifications", fn: syncNotifications }
    );

    // Run all queued sync tasks
    await runSyncQueue(db);

    // 🔄 Refresh data from server - KEEP THIS INSIDE MUTEX
    const API_URL = await getApiUrl();
    const token = await SecureStore.getItemAsync('authToken');

    const response = await fetch(`${API_URL}/user/sync-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to refresh data');

    const freshSyncData = await response.json();

    console.log("💾 Saving fresh server data to local SQLite...");
    await saveSyncDataToSQLite(freshSyncData, db);
    console.log("✅ Complete sync cycle finished");

  } catch (err) {
    console.error("❌ Sync operation failed:", err);
  } finally {
    // Always release mutex in finally block
    dbMutex.release('sync');
  }
}



export function setupNetworkSyncListener() {
  console.log('NetInfo listener initialized');

  return NetInfo.addEventListener(async (state) => {
    if (!isDbInitialized || !state.isConnected) return;

    console.log('Back online → waiting for screen to provide DB');
    // Sync will be triggered when ResultScreen or SplashScreen calls triggerSyncIfOnline(db)
  });
}

// =====================================
// 🔄 Background interval sync (30 sec)
// =====================================
let intervalSyncStarted = false;
let syncIntervalId = null;

export function startIntervalSync(db, flagsProvider) {
  // Prevent multiple intervals
  if (intervalSyncStarted) {
    console.log("🔄 Interval sync already running");
    return null; // Return null if already running
  }
  
  intervalSyncStarted = true;

  console.log("⏱ Background sync every 30s started");

  syncIntervalId = setInterval(async () => {
    try {
      const flags = flagsProvider();
      console.log("🔄 Interval sync check - flags:", {
        isOffline: flags.isOffline,
        isReachable: flags.isReachable, 
        isApiLoaded: flags.isApiLoaded
      });
      await triggerSyncIfOnline(db, flags);
    } catch (error) {
      console.error("Interval sync error:", error);
    }
  }, 30000); // 30 seconds

  // Return cleanup function
  return () => {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
    intervalSyncStarted = false;
    console.log("🛑 Background sync stopped via cleanup function");
  };
}

export function stopIntervalSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  intervalSyncStarted = false;
  console.log("🛑 Background sync stopped via direct call");
}

async function getAuthToken() {
  const { getItemAsync } = await import('expo-secure-store');
  return await getItemAsync('auth_token');
}

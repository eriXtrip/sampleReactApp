// local-database/services/syncUp.js
import { getApiUrl } from '../../utils/apiManager.js';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';

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

    // ---- Get unsynced local notifications ----
    const unsyncedNotifications = await db.getAllAsync(`
      SELECT rowid, server_notification_id, type, title, message, is_read, created_at, read_at, is_synced
      FROM notifications
      WHERE is_synced = 0
    `);

    if (!unsyncedNotifications.length) return true;

    const res = await fetch(`${API_URL}/user/sync-up-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        notifications: unsyncedNotifications.map(n => ({
          notification_id: n.server_notification_id,
          type: n.type,
          title: n.title,
          message: n.message,
          is_read: n.is_read === 1,
          created_at: n.created_at,
          read_at: n.read_at,
          is_synced: n.is_synced === 1
        }))
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const { inserted_notification_ids = [] } = await res.json();

    // ---- Mark local notifications as synced ----
    for (let i = 0; i < unsyncedNotifications.length; i++) {
      await db.runAsync(`
        UPDATE notifications
        SET server_notification_id = ?, is_synced = 1, synced_at = datetime('now')
        WHERE rowid = ?
      `, [inserted_notification_ids[i] || null, unsyncedNotifications[i].rowid]);
    }

    console.log(`✅ Synced ${unsyncedNotifications.length} notifications`);
    return true;

  } catch (err) {
    console.error('❌ Notifications sync error:', err);
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


export async function triggerSyncIfOnline(db) {
  if (!db) {
    console.error('triggerSyncIfOnline FAILED → DB is null!');
    return;
  }
  if (!isDbInitialized) return;

  const net = await NetInfo.fetch();
  if (net.isConnected) {
    console.log('Online → syncing...');
    await syncTestScoresToServer(db);
    await syncProgressToServer(db);
    await syncAchievements(db);
    await syncNotifications(db);
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

async function getAuthToken() {
  const { getItemAsync } = await import('expo-secure-store');
  return await getItemAsync('auth_token');
}

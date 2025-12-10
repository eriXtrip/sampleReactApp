import { useState, useEffect, useContext } from 'react';
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { triggerSyncIfOnline } from '../local-database/services/syncUp';
import { waitForDb } from '../utils/dbWaiter';

export default function usePullToRefresh(db, initialized, onSyncComplete) {
  const [refreshing, setRefreshing] = useState(false);
  const [activeDB, setActiveDB] = useState(null);
  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);

  // Wait for DB when hook mounts or db/initialized changes
  useEffect(() => {
    let isMounted = true;

    async function initDb() {
      try {
        const dbReady = await waitForDb(db, initialized);
        if (isMounted) setActiveDB(dbReady);
      } catch (err) {
        console.error("DB failed to initialize in pull-to-refresh:", err.message);
      }
    }

    initDb();
    return () => { isMounted = false; };
  }, [db, initialized]);

  const onRefresh = async () => {
    if (!activeDB) {
      console.log('❌ No database available for sync');
      return;
    }

    setRefreshing(true);
    console.log('🔄 Pull-to-refresh triggered');

    try {
      await triggerSyncIfOnline(activeDB, { isOffline, isReachable, isApiLoaded });

      console.log('✅ Pull-to-refresh sync completed');

      if (onSyncComplete) {
        await onSyncComplete();
      }

    } catch (error) {
      console.error('❌ Pull-to-refresh sync failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return {
    refreshing,
    onRefresh,
    refreshControlProps: {
      refreshing,
      onRefresh,
      colors: ['#007AFF'],
      tintColor: '#007AFF',
      title: 'Syncing...',
      titleColor: '#666',
    }
  };
}

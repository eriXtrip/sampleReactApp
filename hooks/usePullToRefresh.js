// hooks/usePullToRefresh.js
import { useState, useContext } from 'react';
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { triggerSyncIfOnline } from '../local-database/services/syncUp';

export default function usePullToRefresh(db, onSyncComplete) {
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);

  const onRefresh = async () => {
    if (!db) {
      console.log('❌ No database available for sync');
      return;
    }

    setRefreshing(true);
    console.log('🔄 Pull-to-refresh triggered');
    
    try {
      await triggerSyncIfOnline(db, {
        isOffline,
        isReachable,
        isApiLoaded
      });
      
      console.log('✅ Pull-to-refresh sync completed');
      
      // Call optional completion callback
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
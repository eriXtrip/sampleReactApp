import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';
import { getApiUrl } from '../utils/apiManager';
import { testServerConnection } from '../local-database/services/testServerConnection';

export const ApiUrlContext = createContext({
  API_URL: null,
  refreshApiUrl: () => Promise.resolve(),
  isReachable: false,
  isOffline: false,
  isApiLoaded: false,
});

export const ApiUrlProvider = ({ children }) => {
  const [API_URL, setApiUrl] = useState(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isReachable, setIsReachable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const refreshApiUrl = useCallback(async () => {
    try {
      console.log('🔄 Refreshing API URL and network status...');
      // Check network status
      const networkState = await Network.getNetworkStateAsync();
      const isConnected = networkState.isConnected;
      console.log('📶 Network state:', isConnected);
      setIsOffline(!isConnected);

      // If offline, skip server check
      if (!isConnected) {
        console.log('🚫 No internet connection, skipping server check');
        setApiUrl(null);
        setIsReachable(false);
        setIsApiLoaded(true);
        return null;
      }

      // Get API URL and check server
      const url = await getApiUrl();
      console.log('🌐 Retrieved API URL:', url);
      setApiUrl(url);
      setIsApiLoaded(true);
      const reachable = await testServerConnection(url);
      setIsReachable(reachable);
      console.log('🔎 Server reachable?', reachable);
      return url;
    } catch (error) {
      console.error('❌ Failed to refresh API URL or network status:', error.message);
      setApiUrl(null);
      setIsApiLoaded(true);
      setIsReachable(false);
      setIsOffline(true); // Assume offline on error
      return null;
    }
  }, []);

  useEffect(() => {
    refreshApiUrl();
  }, [refreshApiUrl]);

  return (
    <ApiUrlContext.Provider value={{ API_URL, refreshApiUrl, isReachable, isOffline, isApiLoaded }}>
      {children}
    </ApiUrlContext.Provider>
  );
};
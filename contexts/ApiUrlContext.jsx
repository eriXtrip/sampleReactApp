// context/ApiUrlContext.js
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getApiUrl } from '../utils/apiManager';
import { testServerConnection } from '../local-database/services/testServerConnection';

export const ApiUrlContext = createContext({
  API_URL: null,
  refreshApiUrl: () => Promise.resolve(),
  isReachable: false,
  isOffline: false,
  isApiLoaded: false,
  networkType: null,
  isConnected: false,
  connectionDetails: {},
});

export const ApiUrlProvider = ({ children }) => {
  const [API_URL, setApiUrl] = useState(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isReachable, setIsReachable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [networkType, setNetworkType] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState({});
  
  const isMounted = useRef(true);
  const prevConnectionRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Manual refresh function
  const refreshApiUrl = useCallback(async (force = false) => {
    try {
      console.log('🔄 Refreshing API URL...');
      
      // Get current network state
      const netState = await NetInfo.fetch();
      const nowConnected = netState.isConnected;
      
      console.log('📶 Current network:', {
        connected: nowConnected,
        type: netState.type,
        reachable: netState.isInternetReachable,
      });

      // Update states
      if (isMounted.current) {
        setIsConnected(nowConnected);
        setIsOffline(!nowConnected);
        setNetworkType(netState.type);
        setConnectionDetails(netState.details || {});
      }

      // If offline, set states and return
      if (!nowConnected) {
        console.log('🚫 No internet connection');
        if (isMounted.current) {
          setApiUrl(null);
          setIsReachable(false);
          setIsApiLoaded(true);
        }
        return null;
      }

      // Get API URL
      const url = await getApiUrl();
      console.log('🌐 Retrieved API URL:', url);
      
      if (isMounted.current) {
        setApiUrl(url);
        setIsApiLoaded(true);
      }

      // Test server connection (with timeout to prevent hanging)
      const reachable = await testServerConnection(url);
      console.log('🔎 Server reachable?', reachable);
      
      if (isMounted.current) {
        setIsReachable(reachable);
      }
      
      return url;
    } catch (error) {
      //console.error("❌ Logout failed:", logoutError);('❌ Failed to refresh API:', error.message);
      if (isMounted.current) {
        setApiUrl(null);
        setIsApiLoaded(true);
        setIsReachable(false);
        setIsOffline(true);
      }
      return null;
    }
  }, []);

  // Real-time network listener
  useEffect(() => {
    let unsubscribe;

    const handleNetworkChange = (state) => {
      console.log('📡 Network change detected:', {
        connected: state.isConnected,
        type: state.type,
        reachable: state.isInternetReachable,
      });

      const prevConnected = prevConnectionRef.current;
      const nowConnected = state.isConnected;

      // Update state
      if (isMounted.current) {
        setIsConnected(nowConnected);
        setIsOffline(!nowConnected);
        setNetworkType(state.type);
        setConnectionDetails(state.details || {});
      }

      // Only refresh API if connection state changed
      if (prevConnected !== nowConnected) {
        console.log('🔁 Connection state changed, refreshing API...');
        refreshApiUrl();
      }

      // Update previous state
      prevConnectionRef.current = nowConnected;
    };

    // Setup listener
    unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Get initial state
    NetInfo.fetch().then(initialState => {
      prevConnectionRef.current = initialState.isConnected;
      handleNetworkChange(initialState);
      
      // Initial API refresh
      if (initialState.isConnected) {
        refreshApiUrl();
      }
    });

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [refreshApiUrl]); // Add refreshApiUrl as dependency

  // Provide context value
  const contextValue = {
    API_URL,
    refreshApiUrl,
    isReachable,
    isOffline,
    isApiLoaded,
    networkType,
    isConnected,
    connectionDetails,
  };

  return (
    <ApiUrlContext.Provider value={contextValue}>
      {children}
    </ApiUrlContext.Provider>
  );
};
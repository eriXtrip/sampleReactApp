import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { getApiUrl, getCachedApiUrl } from '../utils/apiManager';

const RankingContext = createContext();
export const useRanking = () => useContext(RankingContext);

export function RankingProvider({ children }) {
  const db = useSQLiteContext();

  const [API_URL, setApiUrl] = useState(null);
  const [token, setToken] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // 1️⃣ Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  // 2️⃣ Load API URL
  useEffect(() => {
    const loadApiURL = async () => {
      try {
        const cachedUrl = await getCachedApiUrl();
        if (cachedUrl) setApiUrl(cachedUrl);

        const freshUrl = await getApiUrl();
        setApiUrl(freshUrl);
      } catch (err) {
        console.error('Failed to load API URL:', err);
        setError('API NOT AVAILABLE');
      }
    };
    loadApiURL();
  }, []);

  // 3️⃣ Load user token
  useEffect(() => {
    const loadToken = async () => {
      try {
        const row = await db.getAllAsync(`SELECT token FROM users LIMIT 1;`);
        if (row.length > 0) setToken(row[0].token);
      } catch (err) {
        console.error("Failed to load user token:", err);
        setError('TOKEN NOT AVAILABLE');
      }
    };
    loadToken();
  }, [db]);

  // 4️⃣ Fetch ranking if online, API ready, and token available
  useEffect(() => {
    if (!API_URL || !token) return;

    const fetchRanking = async () => {
      setLoading(true);
      setError(null);

      if (!isOnline) {
        setError('RANKING NOT AVAILABLE\nPlease connect to the internet');
        setRanking([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/ranking/overall`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          setError('RANKING NOT AVAILABLE\nCannot reach server');
          setRanking([]);
          console.error('Ranking fetch failed:', res.status);
          return;
        }

        const json = await res.json();
        setRanking(json.ranking || []);
      } catch (err) {
        console.error('Error fetching ranking:', err);
        setError('RANKING NOT AVAILABLE\nCannot reach server');
        setRanking([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [API_URL, token, isOnline]);

  return (
    <RankingContext.Provider value={{ ranking, loading, error, isOnline }}>
      {children}
    </RankingContext.Provider>
  );
}

// SAMPLEREACTAPP/contexts/SearchContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getApiUrl, getCachedApiUrl } from '../utils/apiManager'; // ✅ import sync getter

export const SearchContext = createContext();

export function SearchProvider({ children }) {
  // ✅ Initialize from in-memory cache if available
  const initialUrl = getCachedApiUrl();
  const [API_URL, setApiUrl] = useState(initialUrl);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only fetch from AsyncStorage if not already cached
  useEffect(() => {
    if (!initialUrl) {
      (async () => {
        try {
          const url = await getApiUrl(); // This will also populate inMemoryApiUrl
          setApiUrl(url);
          console.log('✅ API URL resolved:', url);
        } catch (err) {
          //console.error("❌ Logout failed:", logoutError);('❌ Failed to get API URL:', err);
          setError('Configuration error');
        }
      })();
    }
  }, [initialUrl]); // Run only if initialUrl was null

  const fetchPublicSubjects = useCallback(async (userId) => {
    if (!API_URL || !userId) {
      console.warn('⚠️ Missing API_URL or userId in fetchPublicSubjects');
      return;
    }

    console.log("user_id in fetchPublicSubjects: ", userId);
    console.log('🔍 Starting fetch to:', `${API_URL}/search/subjects`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/search/subjects?user_id=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Subjects received:', data.subjects);
      setSubjects(data.subjects || []);
    } catch (err) {
      //console.error("❌ Logout failed:", logoutError);('❌ Error fetching public subjects:', err);
      setError(err.message || 'Unable to load subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchAvailableSections = useCallback(async (userId) => {
    if (!API_URL || !userId) {
      consolle.log('userId and API_URL: ', userId , API_URL);
      console.warn('⚠️ Missing API_URL or userId');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/search/sections?user_id=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Sections received:', data.sections);
      setSections(data.sections || []);
    } catch (err) {
      //console.error("❌ Logout failed:", logoutError);('❌ Error fetching sections:', err);
      setError(err.message || 'Unable to load sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  return (
    <SearchContext.Provider
      value={{
        subjects,
        sections,
        loading,
        error,
        fetchPublicSubjects,
        fetchAvailableSections,
        API_URL,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
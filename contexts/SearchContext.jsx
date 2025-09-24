// SAMPLEREACTAPP/contexts/SearchContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'; // ✅ added useEffect
import { getApiUrl } from '../utils/apiManager';

export const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [API_URL, setApiUrl] = useState(null); // Will hold the resolved URL

  // Fetch API URL on mount
  useEffect(() => {
    (async () => {
      try {
        const url = await getApiUrl(); // Assuming getApiUrl() is async
        setApiUrl(url);
        console.log('✅ API URL resolved:', url);
      } catch (err) {
        console.error('❌ Failed to get API URL:', err);
        setError('Configuration error');
      }
    })();
  }, []);

  const fetchPublicSubjects = useCallback(async () => {
    // Guard: don't fetch if URL isn't ready
    if (!API_URL) {
      console.warn('⚠️ API URL not ready yet');
      return;
    }

    console.log('🔍 Starting fetch to:', `${API_URL}/search/subjects`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/search/subjects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Subjects received:', data.subjects);
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('❌ Error fetching public subjects:', err);
      setError(err.message || 'Unable to load subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]); // ✅ Depend on API_URL, not "url"

  const fetchAvailableSections = useCallback(async (userId) => {
    if (!API_URL || !userId) {
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
      setSections(data.sections || []);
    } catch (err) {
      console.error('❌ Error fetching sections:', err);
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
        API_URL, // optional: expose for debugging
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
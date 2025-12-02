// SAMPLEREACTAPP/contexts/EnrollmentContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getApiUrl } from '../utils/apiManager';

export const EnrollmentContext = createContext();

export function EnrollmentProvider({ children }) {
  const [API_URL, setApiUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const url = await getApiUrl();
        setApiUrl(url);
        console.log('✅ API URL resolved:', url);
      } catch (err) {
        console.error('❌ Failed to get API URL:', err);
        setError('Configuration error');
      }
    })();
  }, []);

  /**
   * Enroll in a public subject (no key needed)
   */
  const enrollInSubject = useCallback(async (pupilId, subjectId) => {
    if (!API_URL) throw new Error('API URL not ready');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/enrollment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pupil_id: pupilId, subject_id: subjectId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      
      return { success: true, message: data.message };
    } catch (err) {
      console.error('❌ Subject enrollment error:', err);
      setError(err.message || 'Enrollment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Check if section requires enrollment key
   */
  const checkSectionRequiresKey = useCallback(async (sectionId) => {
    if (!API_URL) throw new Error('API URL not ready');

    try {
      // We'll create a new endpoint for this check
      const response = await fetch(`${API_URL}/enrollment/section/${sectionId}/requires-key`);
      const data = await response.json();
      return data.requires_key;
    } catch (err) {
      console.error('❌ Section key check error:', err);
      throw err;
    }
  }, [API_URL]);

  /**
   * Enroll in section with enrollment key
   */
  const enrollInSectionWithKey = useCallback(async (pupilId, sectionId, enrollmentKey) => {
    if (!API_URL) throw new Error('API URL not ready');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/enrollment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pupil_id: pupilId, 
          section_id: sectionId, 
          enrollment_key: enrollmentKey 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      
      return { success: true, message: data.message };
    } catch (err) {
      //console.error('❌ Section enrollment error:', err);
      setError(err.message || 'Enrollment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Enroll in section without key (when enrollment_key is null)
   */
  const enrollInSectionWithoutKey = useCallback(async (pupilId, sectionId) => {
    if (!API_URL) throw new Error('API URL not ready');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/enrollment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pupil_id: pupilId, section_id: sectionId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      
      return { success: true, message: data.message };
    } catch (err) {
      // console.error('❌ Section enrollment error:', err);
      setError(err.message || 'Enrollment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  return (
    <EnrollmentContext.Provider
      value={{
        enrollInSubject,
        checkSectionRequiresKey,
        enrollInSectionWithKey,
        enrollInSectionWithoutKey,
        loading,
        error,
        API_URL
      }}
    >
      {children}
    </EnrollmentContext.Provider>
  );
}

export const useEnrollment = () => {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
};
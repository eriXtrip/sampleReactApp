// SAMPLEREACTAPP/utils/apiManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '';

export const getApiUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(API_KEY);
    console.log('[apiManager] Retrieved URL:', url);
    return url;
  } catch (error) {
    console.error('[apiManager] Error getting URL:', error);
    return null;
  }
};

export const setApiUrl = async (url) => {
  try {
    if (!url) throw new Error('URL cannot be empty');
    console.log('[apiManager] Saving URL:', url);
    await AsyncStorage.setItem(API_KEY, url);
    console.log('[apiManager] URL saved successfully');
    return true;
  } catch (error) {
    console.error('[apiManager] Error saving URL:', error);
    throw error;
  }
};

export const clearApiUrl = async () => {
  try {
    await AsyncStorage.removeItem(API_KEY);
    console.log('[apiManager] URL cleared successfully');
  } catch (error) {
    console.error('[apiManager] Error clearing URL:', error);
    throw error;
  }
};
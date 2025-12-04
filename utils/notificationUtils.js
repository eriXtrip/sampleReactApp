// utils/notificationUtils.js
import { showToast, dismissToast } from 'react-native-nitro-toast';

/**
 * Simple toast notification
 */
export const triggerLocalNotification = async (
  title,
  body,
  type = 'info',
  extraOptions = {}
) => {
  showToast(body, {
    title,
    type,
    position: 'top',
    duration: 9500,
    presentation: 'stacked',
    haptics: true,
    containerStyle: {
      marginTop: 120,
      marginHorizontal: 16,
      borderRadius: 12,
      ...extraOptions.containerStyle,
    },
    ...extraOptions,
  });
};

/**
 * Show a loading toast and return its ID for manual dismissal
 */
export const showLoadingToast = (title = 'Processing', message = 'Please wait...') => {
  const toastId = showToast(message, {
    title,
    type: 'loading',
    position: 'top',
    duration: 0, // 0 = manual dismissal
    haptics: true,
    containerStyle: {
      marginTop: 120,
      marginHorizontal: 16,
      borderRadius: 12,
    },
  });
  return toastId;
};

/**
 * Dismiss a specific toast by ID
 */
export const dismissLoadingToast = (toastId) => {
  if (toastId) {
    dismissToast(toastId);
  }
};

/**
 * Show success toast (convenience function)
 */
export const showSuccessToast = (title, message) => {
  triggerLocalNotification(title, message, 'success', {
    duration: 3000,
  });
};

/**
 * Show error toast (convenience function)
 */
export const showErrorToast = (title, message) => {
  triggerLocalNotification(title, message, 'error', {
    duration: 3000,
  });
};

export const showWarringToast = (title, message) => {
  triggerLocalNotification(title, message, 'warning', {
    duration: 3000,
  });
};
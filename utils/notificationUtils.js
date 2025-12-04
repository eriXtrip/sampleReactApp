// utils/notificationUtils.js

import * as Notifications from 'expo-notifications';
import { showToast } from 'react-native-nitro-toast';

//   

export const triggerLocalNotification = async (title, body) => {
  showToast(body, {
    title,
    type: 'info',
    position: 'top',
    duration: 3500,
    presentation: 'alert',
    haptics: true,
    backgroundColor: '#333333',
    titleColor: '#ffffff',
    messageColor: '#e0e0e0',
  });
};
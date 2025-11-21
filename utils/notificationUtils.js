// utils/notificationUtils.js

import * as Notifications from 'expo-notifications';

export const triggerLocalNotification = async (title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
};

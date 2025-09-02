// app/_layout.jsx

import { useColorScheme, Alert, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from '../contexts/ProfileContext';
import * as Notifications from 'expo-notifications';
import { useEffect, useContext } from 'react';
import { PermissionsAndroid } from 'react-native';
import { ApiUrlProvider } from '../contexts/ApiUrlContext';
import { UserProvider } from '../contexts/UserContext';
import { SQLiteProvider } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Application from 'expo-application';
import OfflineBanner from '../components/OfflineBanner';
import { ApiUrlContext } from '../contexts/ApiUrlContext';

const LESSONS_DIR = `${
  FileSystem.documentDirectory
}Android/media/${Application.applicationId}/lesson_contents/`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const askNotificationPermission = async () => {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    if (canAskAgain) {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Please allow notifications in your settings to receive alerts.',
          [
            { text: 'OK' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      Alert.alert(
        'Notification Blocked',
        'You have blocked notifications. Please enable them manually in system settings.',
        [
          { text: 'OK' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }
};

const askStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [];
      const androidVersion = parseInt(Platform.Version, 10);
      if (androidVersion >= 33) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
        );
      } else {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
      }
      const results = await Promise.all(
        permissions.map((permission) =>
          PermissionsAndroid.request(permission, {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to save and open files.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          })
        )
      );
      const allGranted = results.every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );
      if (allGranted) {
        console.log('✅ Storage permissions granted');
        return true;
      } else {
        Alert.alert(
          'Storage Permission Denied',
          'Please allow storage access in your settings to save/open files.',
          [
            { text: 'OK' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
    } catch (err) {
      console.warn('Error requesting storage permissions:', err);
      return false;
    }
  }
  return true;
};

const ensureLessonsDir = async () => {
  try {
    console.log('🔍 Checking lessons folder:', LESSONS_DIR);
    if (!LESSONS_DIR) {
      throw new Error('LESSONS_DIR is undefined or invalid');
    }
    const dirInfo = await FileSystem.getInfoAsync(LESSONS_DIR);
    console.log('ℹ️ Dir exists?', dirInfo.exists);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LESSONS_DIR, { intermediates: true });
      console.log('✅ Created lessons folder:', LESSONS_DIR);
    } else {
      console.log('📂 lesson_contents folder already exists');
    }
  } catch (e) {
    console.error('❌ Error creating lessons folder:', e);
  }
};

const RootLayout = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { isApiLoaded } = useContext(ApiUrlContext);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification received:', notification);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const hasStoragePermission = await askStoragePermission();
      if (hasStoragePermission) {
        await ensureLessonsDir();
      } else {
        console.warn('Storage permissions not granted, skipping directory creation.');
      }
      await askNotificationPermission();
    })();
  }, []);

  console.log('🖼 Rendering RootLayout with isApiLoaded:', isApiLoaded);

  return (
    <SQLiteProvider databaseName="mydatabase.db">
      <ApiUrlProvider>
        <UserProvider>
          <ProfileProvider>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <OfflineBanner />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.Background },
                headerTintColor: theme.title,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="TestSQLInjectionScreen" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
              <Stack.Screen name="(profile)" options={{ headerShown: false }} />
              <Stack.Screen name="(home)" options={{ headerShown: false }} />
              <Stack.Screen name="(content_render)" options={{ headerShown: false }} />
              <Stack.Screen name="contact" options={{ title: 'Contact' }} />
            </Stack>
          </ProfileProvider>
        </UserProvider>
      </ApiUrlProvider>
    </SQLiteProvider>
  );
};

export default RootLayout;
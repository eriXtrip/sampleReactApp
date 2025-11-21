// app/_layout.jsx
import { useEffect, useContext } from 'react';
import { useColorScheme, Alert, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { ProfileProvider, ProfileContext } from '../contexts/ProfileContext';
import { ApiUrlProvider, ApiUrlContext } from '../contexts/ApiUrlContext';
import { UserProvider } from '../contexts/UserContext';
import { SearchProvider } from '../contexts/SearchContext';
import { EnrollmentProvider } from '../contexts/EnrollmentContext';
import { DownloadProvider } from '../contexts/DownloadContext';
import { RankingProvider } from '../contexts/RankingContext';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import { PermissionsAndroid } from 'react-native';
import DatabaseBinder from './DatabaseBinder';

import { LESSONS_DIR } from '../utils/resolveLocalPath';
import { initializeDatabase } from '../local-database/services/database';
import UserService from '../local-database/services/userService';
import ThemedStatusBar from '../components/ThemedStatusBar';


// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Permissions helpers
const askNotificationPermission = async () => {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    if (canAskAgain) {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow notifications in your settings.', [
          { text: 'OK' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
      }
    } else {
      Alert.alert('Notification Blocked', 'Please enable notifications manually.', [
        { text: 'OK' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
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
      return results.every((result) => result === PermissionsAndroid.RESULTS.GRANTED);
    } catch (err) {
      console.warn('Error requesting storage permissions:', err);
      return false;
    }
  }
  return true;
};

const ensureLessonsDir = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(LESSONS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LESSONS_DIR, { intermediates: true });
    }
  } catch (e) {
    console.error('Error creating lessons folder:', e);
  }
};

// This component renders the StatusBar + OfflineBanner + Stack
const RootLayoutContent = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];


  const { isApiLoaded } = useContext(ApiUrlContext);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const hasStoragePermission = await askStoragePermission();
      if (hasStoragePermission) {
        await ensureLessonsDir();
      }
      await askNotificationPermission();
    })();
  }, []);

  useEffect(() => {
    let lastPath = null;
    const un = setInterval(() => {
      try {
        const db = useSQLiteContext(); // only valid inside component; else adapt
        if (db && db.databasePath !== lastPath) {
          lastPath = db.databasePath;
          console.trace('DB path changed ->', db.databasePath); // traces call stack
        }
      } catch (e) {}
    }, 1000);
    return () => clearInterval(un);
  }, []);

  return (
    <>
      {/* Status bar */}
      <ThemedStatusBar themeColors={themeColors} />

      {/* Stack navigator */}
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
    </>
  );
};

const RootLayout = () => {
  return (
    <SQLiteProvider databaseName="mquest.db">
      <DatabaseBinder />
      <ApiUrlProvider> 
        <DownloadProvider>
          <UserProvider>
            <ProfileProvider>
              <SearchProvider>
                <EnrollmentProvider>
                  <RankingProvider>
                    <RootLayoutContent/>
                  </RankingProvider>
                </EnrollmentProvider>
              </SearchProvider>
            </ProfileProvider>
          </UserProvider>
        </DownloadProvider>
      </ApiUrlProvider>
    </SQLiteProvider>
  );
};

export default RootLayout;

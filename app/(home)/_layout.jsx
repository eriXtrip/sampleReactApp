import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useContext, useMemo } from 'react';
import { Colors } from '../../constants/Colors';
import { ProfileContext, ProfileProvider } from '../../contexts/ProfileContext';
import { UserProvider } from '../../contexts/UserContext';
import { SQLiteProvider } from 'expo-sqlite';

export default function HomeLayout() {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);

  const theme = Colors[
    themeColors === 'system'
      ? (colorScheme === 'dark' ? 'dark' : 'light')
      : themeColors
  ];

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      tabBarHideOnKeyboard: true,
      animation: 'none',
      headerStyle: {
        backgroundColor: theme.navBackground,
      },
      headerTintColor: theme.title,
    }),
    [theme.navBackground, theme.title, themeColors]
  );

  return (
    <SQLiteProvider databaseName="mquest.db">
      <ProfileProvider>
        <UserProvider>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen
              name="searchpage"
              options={{ title: 'Search' }}
            />
            <Stack.Screen
              name="self_enroll_page"
              options={{ title: '' }}
            />
            <Stack.Screen
              name="subject_page"
              options={{ title: '' }}
            />
            <Stack.Screen
              name="section_page"
              options={{ title: '' }}
            />
            <Stack.Screen
              name="achievements_page"
              options={{ title: '🌟 Your Achievements' }}
            />
            <Stack.Screen
              name="recent_activity_page"
              options={{ title: '📚 Recent Activity' }}
            />
            <Stack.Screen
              name="lesson_page"
              options={{ title: 'Lesson' }}
            />
          </Stack>
        </UserProvider>
      </ProfileProvider>
    </SQLiteProvider>
  );
}

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useContext, useMemo } from 'react';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { UserProvider } from '../../contexts/UserContext';
import { SQLiteProvider } from 'expo-sqlite';
import ThemedHeader from '../../components/ThemedHeader';
import ThemedStatusBar from '../../components/ThemedStatusBar';

export default function ContentRenderLayout() {
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
      header: ({ options, navigation }) => (
        <ThemedHeader options={options} navigation={navigation} />
      ),
      headerStyle: {
        backgroundColor: theme.navBackground,
      },
      headerTintColor: theme.title,
    }),
    [theme.navBackground, theme.title, themeColors]
  );

  return (
    <SQLiteProvider databaseName="mydatabase.db">
      <UserProvider>
        <ThemedStatusBar themeColors={themeColors} />
        <Stack screenOptions={screenOptions}>
          <Stack.Screen
            name="general"
            options={{
              title: '',
            }}
          />
        </Stack>
      </UserProvider>
    </SQLiteProvider>
  );
}

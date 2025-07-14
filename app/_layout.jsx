import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from '../contexts/ProfileContext';

const RootLayout = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <>
      <ProfileProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.Background },
            headerTintColor: theme.title,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
          <Stack.Screen name="(profile)" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ title: 'About' }} />
          <Stack.Screen name="contact" options={{ title: 'Contact' }} />
        </Stack>
      </ProfileProvider>
    </>
  );
};

export default RootLayout;
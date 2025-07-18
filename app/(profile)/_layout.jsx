import { Stack } from 'expo-router';
import { useColorScheme, View, Platform, StatusBar, Text, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider } from "../../contexts/UserContext";
import { SQLiteProvider } from 'expo-sqlite';

export default function ProfileLayout() {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const needsInvertedStatusBar = themeColors === 'system' ? colorScheme === 'light' : themeColors === 'light';

  // Custom header component for all screens
  const CustomHeader = ({ options, navigation }) => (
    <View
      style={{
        height: 60,
        backgroundColor: theme.navBackground,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      {navigation.canGoBack() && (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
      )}
      <Text
        style={{
          color: theme.title,
          fontSize: 20,
          fontWeight: 'bold',
          flex: 1,
          textAlign: 'left',
          paddingLeft: navigation.canGoBack() ? 16 : 0,
        }}
      >
        {options.title || 'Profile'}
      </Text>
      <View style={{ width: 24 }} />
    </View>
  );

  return (
    <SQLiteProvider databaseName="mydatabase.db">
      <UserProvider>
        {Platform.OS === 'android' && (
          <View
            style={{
              height: 40,
              backgroundColor: theme.statusbarBackground,
            }}
          >
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle={needsInvertedStatusBar ? 'dark-content' : 'light-content'}
            />
          </View>
        )}
        <Stack
          screenOptions={{
            headerShown: true,
            tabBarHideOnKeyboard: true,
            animation: 'none',
            header: ({ options, navigation }) => (
              <CustomHeader options={options} navigation={navigation} />
            ),
            headerStyle: {
              backgroundColor: theme.navBackground,
            },
            headerTintColor: theme.title,
          }}
        >
          <Stack.Screen
            name="change-password"
            options={{
              title: 'Change Password',
            }}
          />
          <Stack.Screen
            name="theme"
            options={{
              title: 'Change Theme',
            }}
          />
        </Stack>
      </UserProvider>
    </SQLiteProvider>
  );
}
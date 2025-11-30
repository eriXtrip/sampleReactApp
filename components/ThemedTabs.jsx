import { Tabs } from "expo-router";
import { useColorScheme, View, StatusBar, Platform } from "react-native";
import { Colors } from '../constants/Colors';
import { Ionicons } from "@expo/vector-icons";
import AnimatedTabIcon from './AnimatedTabIcon';
import { useContext } from 'react';
import { ProfileContext } from '../contexts/ProfileContext';

export default function ThemedTabs() {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const needsInvertedStatusBar = theme === Colors.light;

  return (
    <>
      <Tabs screenOptions={{ 
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.navBackground,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.title,
          fontWeight: 'bold',
        },
        headerTintColor: theme.title,
        statusBarStyle: needsInvertedStatusBar ? "dark" : "light",
        statusBarColor: theme.navBackground,
        tabBarStyle: {
          backgroundColor: theme.navBackground,
          paddingTop: 20,
          height: Platform.OS === 'android' ? 90 : 0,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: theme.iconColorFocused,
        tabBarInactiveTintColor: theme.iconColor
      }}>
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: "Home", 
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} iconName="home" theme={theme} />
            ) 
          }} 
        />
        <Tabs.Screen 
          name="subjectlist" 
          options={{ 
            title: "Section", 
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} iconName="book" theme={theme} />
            ) 
          }} 
        />
        <Tabs.Screen 
          name="notification" 
          options={{ 
            title: "Notification", 
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} iconName="notifications" theme={theme} />
            )
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: "Profile", 
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon focused={focused} iconName="person" theme={theme} />
            ) 
          }} 
        />
      </Tabs>
    </>
  );
}
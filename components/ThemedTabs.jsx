import { Tabs } from "expo-router";
import { useColorScheme, Platform, TouchableOpacity } from "react-native";
import { Colors } from '../constants/Colors';
import { Ionicons } from "@expo/vector-icons";
import AnimatedTabIcon from './AnimatedTabIcon';
import { useContext } from 'react';
import { ProfileContext } from '../contexts/ProfileContext';
import { wait } from '../utils/wait';

export default function ThemedTabs() {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const needsInvertedStatusBar = theme === Colors.light;

  const delayedPress = (onPress) => async () => {
    await wait(500); // 500ms delay before navigation
    onPress();
  };

  return (
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
        paddingTop: 30,
        height: Platform.OS === 'android' ? 100 : 0,
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
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={delayedPress(props.onPress)} />
          )
        }} 
      />
      <Tabs.Screen 
        name="subjectlist" 
        options={{ 
          title: "Section", 
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon focused={focused} iconName="book" theme={theme} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={delayedPress(props.onPress)} />
          )
        }} 
      />
      <Tabs.Screen 
        name="notification" 
        options={{ 
          title: "Notification", 
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon focused={focused} iconName="notifications" theme={theme} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={delayedPress(props.onPress)} />
          )
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile", 
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon focused={focused} iconName="person" theme={theme} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={delayedPress(props.onPress)} />
          )
        }} 
      />
    </Tabs>
  );
}

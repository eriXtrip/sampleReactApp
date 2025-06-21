import { Tabs } from "expo-router"
import { useColorScheme } from "react-native"
import { Colors } from '../../constants/Colors'
import { Ionicons } from "@expo/vector-icons"

export default function DashboardLayout() {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <Tabs screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
            backgroundColor: theme.navBackground,
            paddingTop: 10,
            height: 90,
            borderTopWidth: 0, // Remove default top border
            borderTopLeftRadius: 20, // Round top-left corner
            borderTopRightRadius: 20, // Round top-right corner
            position: 'absolute', // Needed for proper shadow
            left: 0,
            right: 0,
            bottom: 0,
            elevation: 10, // Android shadow
            shadowColor: '#000', // iOS shadow
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
        },
        tabBarActiveTintColor: theme.iconColorFocused,
        tabBarInactiveTintColor: theme.iconColor
    }}>
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Home", 
          tabBarIcon: ({ focused }) => (
            <Ionicons
              size={24}
              name={focused ? 'home' : 'home-outline'}
              color={focused ? theme.iconColorFocused : theme.iconColor}
            />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="books" 
        options={{ 
          title: "Subject", 
          tabBarIcon: ({ focused }) => (
            <Ionicons
              size={24}
              name={focused ? 'book' : 'book-outline'}
              color={focused ? theme.iconColorFocused : theme.iconColor}
            />
          ) 
        }} 
      />
      <Tabs.Screen 
        name="create" 
        options={{ 
          title: "Settings", 
          tabBarIcon: ({ focused }) => (
            <Ionicons
              size={24}
              name={focused ? 'settings' : 'settings-outline'}
              color={focused ? theme.iconColorFocused : theme.iconColor}
            />
          ) 
        }} 
      />
    </Tabs>
  )
}
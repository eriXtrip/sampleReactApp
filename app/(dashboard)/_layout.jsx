import { Tabs } from "expo-router"
import { useColorScheme, Animated, View, Easing } from "react-native"
import { Colors } from '../../constants/Colors'
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useRef } from 'react'
import { useNavigationState } from '@react-navigation/native'

const AnimatedTabIcon = ({ focused, iconName, theme, routeName }) => {
  const widthAnim = useRef(new Animated.Value(40)).current
  const fillAnim = useRef(new Animated.Value(0)).current
  const navigationState = useNavigationState(state => state)
  const prevRouteName = useRef(null)

  useEffect(() => {
    const currentRoute = navigationState.routes[navigationState.index]?.name
    
    // Reset animation values when switching tabs
    if (prevRouteName.current !== currentRoute) {
      widthAnim.setValue(40)
      fillAnim.setValue(0)
    }

    // Always animate to target values
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: focused ? 65 : 40,
        tension: 10,
        friction: 100,
        useNativeDriver: false,
      }),
      Animated.timing(fillAnim, {
        toValue: focused ? 1 : 0,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ]).start()

    prevRouteName.current = currentRoute
  }, [focused, navigationState.index])

  const bgColor = focused ? theme.iconBackground : 'transparent'

  return (
    <Animated.View style={{
      backgroundColor: bgColor,
      paddingVertical: 6,
      borderRadius: 20,
      width: widthAnim,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    }}>
      <View style={{ position: 'relative', width: 24, height: 24 }}>
        <Ionicons
          size={24}
          name={`${iconName}-outline`}
          color={theme.iconColor}
        />
        <Animated.View style={{
          position: 'absolute',
          opacity: fillAnim
        }}>
          <Ionicons
            size={24}
            name={iconName}
            color={theme.iconColorFocused}
          />
        </Animated.View>
      </View>
    </Animated.View>
  )
}

export default function DashboardLayout() {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <Tabs screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
            backgroundColor: theme.navBackground,
            paddingTop: 20,
            height: 120,
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
          title: "Subject", 
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
  )
}
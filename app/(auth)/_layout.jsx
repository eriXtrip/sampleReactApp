import { Stack } from "expo-router"
import { useColorScheme, View, Platform, StatusBar } from "react-native"
import { Colors } from "../../constants/Colors"
import { useEffect } from "react";
import * as NavigationBar from 'expo-navigation-bar';
import { UserProvider } from "../../contexts/UserContext";


export default function AuthLayout() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light   
    const needsInvertedStatusBar = colorScheme === "light"

    return (
        <UserProvider>
            {/* Android-specific status bar handling */}
            {Platform.OS === 'android' && (
            <View style={{
                height: StatusBar.currentHeight,
                backgroundColor: theme.navBackground
            }}>
                <StatusBar 
                translucent
                backgroundColor="transparent"
                barStyle={needsInvertedStatusBar ? "dark-content" : "light-content"}
                />
            </View>
            )}
            <Stack screenOptions={{
                headerShown: false,
                animation: "none",
                headerStyle: {
                    backgroundColor: theme.navBackground,
                },
                headerTintColor: theme.title,
                statusBarStyle: needsInvertedStatusBar ? "dark" : "light",
                statusBarColor: theme.navBackground, // Android specific
                statusBarColor: "transparent",
            }} />
        </UserProvider>
    )
}
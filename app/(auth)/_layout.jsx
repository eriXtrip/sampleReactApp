// app/(auth)/_layout.jsx

import { Stack } from "expo-router"
import { useColorScheme, View, Platform, StatusBar } from "react-native"
import { Colors } from "../../constants/Colors"
import { UserProvider } from "../../contexts/UserContext";
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../../local-database/services/database';
import { ProfileContext } from '../../contexts/ProfileContext';
import { useContext } from 'react';

export default function AuthLayout() {
    const colorScheme = useColorScheme();
    const { themeColors } = useContext(ProfileContext);
    const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
    const needsInvertedStatusBar = colorScheme === "light"

    return (
        <SQLiteProvider 
            databaseName="mquest.db" 
        >
            <UserProvider>
                {/* Android-specific status bar handling */}
                {/* {Platform.OS === 'android' && (
                <View style={{
                    height: 40,
                    backgroundColor: theme.statusbarBackground, 
                }}>
                <StatusBar 
                    translucent
                    backgroundColor="transparent"
                    barStyle={needsInvertedStatusBar ? "dark-content" : "light-content"}
                />
                </View>
                )} */}
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
        </SQLiteProvider>
    )
}
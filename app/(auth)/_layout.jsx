import { Stack } from "expo-router"
import { useColorScheme } from "react-native"
import { Colors } from "../../constants/Colors"
import { StatusBar } from "expo-status-bar"

export default function AuthLayout() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light   
    const statusBarStyle = colorScheme === "dark" ? "light" : "dark"

    // Determine if we need inverted status bar for light theme
    const needsInvertedStatusBar = colorScheme === "light"

    return (
        <>
            <StatusBar 
                style={needsInvertedStatusBar ? "dark" : "light"} 
                backgroundColor={theme.navBackground}
            />
            <Stack screenOptions={{
                headerShown: false,
                animation: "none",
                headerStyle: {
                    backgroundColor: theme.navBackground,
                },
                headerTintColor: theme.title,
                statusBarStyle: needsInvertedStatusBar ? "dark" : "light",
                statusBarColor: theme.navBackground, // Android specific
            }} />
        </>
    )
}
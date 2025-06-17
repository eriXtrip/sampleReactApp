import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { Slot } from "expo-router";
import { Stack } from "expo-router";
import { Colors } from "../constants/Colors"
import { StatusBar } from "expo-status-bar";

const RootLayout = () => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light     

  return (
    <>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{
            headerStyle: {backgroundColor: theme.navBackground},
            headerTintColor: theme.title,
        }}>
            <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }}/>
            <Stack.Screen name="about" options={{ title: 'About' }}/>
            <Stack.Screen name="contact" options={{ title: 'Contact' }}/>
        </Stack>
    </>
  );
}

export default RootLayout

const styles = StyleSheet.create({})
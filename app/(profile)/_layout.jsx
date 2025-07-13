import { Stack } from 'expo-router';
import { useColorScheme, View, Platform, StatusBar, Text, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileLayout() {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const needsInvertedStatusBar = theme === 'system' ? colorScheme === 'light' : theme === 'light';

  // Custom header component for all screens
  const CustomHeader = ({ title, navigation }) => (
    <View
      style={{
        height: 60, // Header height
        backgroundColor:  theme.navBackground,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={theme.title} />
      </TouchableOpacity>
      <Text
        style={{
          color: theme.title,
          fontSize: 20,
          fontWeight: 'bold',
          flex: 1,
          textAlign: 'left',
          paddingLeft: 16,
        }}
      >
        {title}
      </Text>
      <View style={{ width: 24 }} />
    </View>
  );

  return (
    <>
      {Platform.OS === 'android' && (
        <View
          style={{
            height: Platform.OS === 'android' ? 40 : 0,
            backgroundColor: theme.navBackground,
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
          animation: 'none',
          header: ({ route, navigation }) => (
            <CustomHeader
              title={route.params?.title || 'Change Theme'}
              navigation={navigation}
            />
          ),
          headerStyle: {
            backgroundColor: theme.navBackground,
          },
          headerTintColor: theme.title,
        }}
      >
        <Stack.Screen
          name="theme"
          options={{
            title: 'Change Theme',
          }}
        />
      </Stack>
    </>
  );
}
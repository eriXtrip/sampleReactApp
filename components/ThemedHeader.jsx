import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { ProfileContext } from '../contexts/ProfileContext';
import { Colors } from '../constants/Colors';

const ThemedHeader = ({ options, navigation }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  return (
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
      </Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

export default ThemedHeader;
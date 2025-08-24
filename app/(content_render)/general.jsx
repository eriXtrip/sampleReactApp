// samplereactapp/app/(content_render)/general.jsx

import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const GeneralPage = () => {
  const { title, content } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.background, // Use theme background
    },
    scrollContainer: {
      flexGrow: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'left',
      marginBottom: 0,
      color: theme.text, // Use theme text color
    },
    contentContainer: {
      backgroundColor: '#f7fafc09', // Fallback to original
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder, // Fallback to original
    },
    content: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'left',
      color: theme.text, // Use theme text color
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText title={false} style={styles.title}>
          {title} 📣
        </ThemedText>
        <Spacer height={20} />
        <View style={styles.contentContainer}>
          <ThemedText style={styles.content}>
            {content}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default GeneralPage;
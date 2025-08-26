// app/(content_render)/content_details.jsx

import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Platform, Alert, PermissionsAndroid, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { getYouTubeEmbedUrl } from "../../utils/youtube";

const LESSON_TYPE_ICON_MAP = {
  general: 'information-circle-outline',
  ppt: 'easel-outline',
  pdf: 'document-attach-outline',
  video: 'videocam-outline',
  link: 'link-outline',
  test: 'document-text-outline',
  match: 'game-controller-outline',
  flash: 'copy-outline',
};

const ContentDetails = () => {
  const { title, type, content, shortDescription } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const [isDone, setIsDone] = useState(false); // State to track done status

  const iconName = LESSON_TYPE_ICON_MAP[type] || 'book-outline';

  const checkStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      if (!permission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to open PDF and PPT files.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }
    return true; // Non-Android platforms don't need this permission
  };

  const isYouTubeUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('youtube.com') || lower.includes('youtu.be');
  };

  const embedUrl = getYouTubeEmbedUrl(content);

  const handleStart = async () => {
    // PDFs and PPTs: share/open with external apps (existing behavior)
    if (['pdf', 'ppt'].includes(type)) {
      if (!content) {
        Alert.alert('Error', 'No file path provided.');
        return;
      }

      const mimeType =
        type === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(content, {
            mimeType,
            dialogTitle: `Open ${title} with`,
          });
        } else {
          Alert.alert('Error', 'No app available to open this file.');
        }
      } catch (err) {
        Alert.alert('Error', `Could not open the file: ${err.message}`);
      }

      return;
    }

    // For test/match/flash -> keep as Start (navigation to respective handlers)
    if (['test', 'match', 'flash'].includes(type)) {
      // TODO: navigate to specific screens for tests/games if implemented
      console.log(`Start action for type: ${type}`);
      // Example: router.push({ pathname: '/quiz', params: {...} })
      return;
    }

    // Other types (fallback)
    console.log(`No handler implemented for type ${type}`);
  };

  const handleMarkAsDone = () => {
    setIsDone((prev) => !prev); // Toggle done state
    console.log(isDone ? 'Marked as undone' : 'Marked as done');
  };

  const buttonText = ['test', 'match', 'flash'].includes(type) ? 'Start' : 'Open';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 0,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    topCard: {
      backgroundColor: theme.navBackground,
      height: 120,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      padding: 20,
      paddingLeft: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 }, // Shadow at the bottom
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5, // For Android
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginLeft: 12,
      paddingRight: 20,
    },
    doneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#48cae4',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 20,
      marginLeft: 20,
      alignSelf: 'flex-start', // Align to the left
    },
    doneText: {
      color: '#ffffff',
      fontSize: 14, // Smaller font size
      fontWeight: '600',
      marginLeft: 6,
    },
    bottomCard: {
      backgroundColor: theme.navBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      marginTop: 20,
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 }, // Shadow at the top
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5, // For Android
    },
    detailText: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.text,
      marginBottom: 12,
    },
    startButton: {
      backgroundColor: '#48cae4',
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginHorizontal: 20,
    },
    startText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topCard}>
        <View style={styles.headerRow}>
          <Ionicons name={iconName} size={50} color={theme.text} />
          <ThemedText style={styles.title}>{title}</ThemedText>
        </View>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={handleMarkAsDone}>
        <Ionicons name={isDone ? 'checkmark-done-outline' : 'checkmark-outline'} size={20} color="#ffffff" />
        <ThemedText style={styles.doneText}>{isDone ? 'Done' : 'Mark as Done'}</ThemedText>
      </TouchableOpacity>

      <View style={styles.bottomCard}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedText style={styles.detailText}>Short Description: {shortDescription}</ThemedText>
          <ThemedText style={styles.detailText}>Type: {type}</ThemedText>

          {type === 'video' && (
            <VideoView
              style={{ width: '100%', height: 250, backgroundColor: 'black' }}
              player={useVideoPlayer(content, (player) => {
                player.loop = false;
                player.pause();
              })}
              allowsFullscreen
              onFullscreenChange={async (isFullscreen) => {
                if (isFullscreen) {
                  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                } else {
                  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
                }
              }}
            />
          )}

          {/* Links: allow only YouTube links and open in WebView */}
          {type === 'link' && isYouTubeUrl(content) && (
            <View style={{ flex: 1, height: 300, }}>
              <WebView
                source={{ uri: embedUrl }}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo={true}
                startInLoadingState
                mediaPlaybackRequiresUserAction={false}
              />
            </View>
          )}
        </ScrollView>

        {type !== 'general' && type !== 'video' && type !== 'link' && (
          <ThemedButton style={styles.startButton} onPress={handleStart}>
            <ThemedText style={styles.startText}>{buttonText}</ThemedText>
          </ThemedButton>
        )}

        <Spacer height={20} />
      </View>
    </ThemedView>
  );
};

export default ContentDetails;

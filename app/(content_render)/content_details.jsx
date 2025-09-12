// app/(content_render)/content_details.jsx

import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';
import { WebView } from 'react-native-webview';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { getYouTubeEmbedUrl } from "../../utils/youtube";
import DangerAlert from '../../components/DangerAlert';
import  lessonData from '../../data/lessonData';

const LESSONS_DIR = `${FileSystem.documentDirectory}Android/media/${Application.applicationId}/lesson_contents/`;

// Resolve a full local path given the filename
const resolveLocalPath = (fileName) => `${LESSONS_DIR}${fileName}`;

const ensureLessonsDir = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(LESSONS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LESSONS_DIR, { intermediates: true });
    }
    return LESSONS_DIR;
  } catch (e) {
    console.error('❌ Error creating lessons folder:', e);
    Alert.alert('Error', 'Failed to create lessons folder. Cannot save files.');
    return null;
  }
};

const openWithChooser = async (uri, title, mimeType) => {
  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: mimeType || '*/*',
        flags: 1,
      });
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType, dialogTitle: title, UTI: mimeType });
      } else {
        Alert.alert('Not supported', 'Opening files is not available on this device.');
      }
    }
  } catch (err) {
    console.error('Open file error:', err);
    Alert.alert('Error', 'No app found to open this file. Please install a compatible app.');
  }
};

const ContentDetails = () => {
  const { title, type, status, shortDescription, file, MIME, size, content } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const normalizeStatus = (val) => (val === true || val === "true" || val === "1");
  const [isDone, setIsDone] = useState(normalizeStatus(status));
  const [fileExists, setFileExists] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Check if local file exists
  useEffect(() => {
    (async () => {
      if (!file) return;
      try {
        const fileInfo = await FileSystem.getInfoAsync(resolveLocalPath(file));
        setFileExists(fileInfo.exists);
      } catch {
        setFileExists(false);
      }
    })();
  }, [file]);

  const iconName = {
    general: 'information-circle-outline',
    ppt: 'easel-outline',
    pdf: 'document-attach-outline',
    video: 'videocam-outline',
    link: 'link-outline',
    test: 'document-text-outline',
    match: 'game-controller-outline',
    flash: 'copy-outline',
    speach: 'mic-outline',
    sentence: 'extension-puzzle-outline',
    gameIMGtext: 'dice-outline',
  }[type] || 'book-outline';

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const targetFolder = await ensureLessonsDir();
      if (!targetFolder) return null;

      const localPath = resolveLocalPath(file); // use file param as filename
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        setFileExists(true);
        setDownloading(false);
        return localPath;
      }

      // Step 1: Download into cache first
      const tempUri = FileSystem.cacheDirectory + file;
      const { uri: downloadedUri } = await FileSystem.downloadAsync(content, tempUri);

      // Step 2: Handle JSON or normal file
      if (['test', 'match', 'flash', 'speach', 'sentence', 'gameIMGtext'].includes(type)) {
        const jsonString = await FileSystem.readAsStringAsync(downloadedUri);
        const parsed = JSON.parse(jsonString);

        // ... (your JSON image download + rewrite logic here) ...

        await FileSystem.writeAsStringAsync(localPath, JSON.stringify(parsed));
      } else {
        await FileSystem.copyAsync({ from: downloadedUri, to: localPath });
      }

      setFileExists(true);
      setDownloading(false);
      console.log("Downloaded", "The file has been downloaded successfully.", localPath);
      return localPath;
    } catch (err) {
      setDownloading(false);
      console.error("Download error:", err);
      Alert.alert("Error", err.message);
      return null;
    }
  };

  const handleMarkAsDone = () => {
    const newState = !isDone;
    setIsDone(newState);
    router.setParams({ status: newState ? "true" : "false" });
  };

  const handleMarkAsDownloaded = async () => {
    if (fileExists) {
      setShowDeleteAlert(true);
    } else {
      await handleDownload();
    }
  };

  const handleOpen = async () => {
    if (!file && !content) return;

    const localPath = resolveLocalPath(file);

    if (['pdf', 'ppt', 'pptx'].includes(type)) {
      let fileUri = null;
      if (!fileExists) {
        fileUri = await handleDownload();
      } else {
        fileUri = localPath;
      }
      if (fileUri) await openWithChooser(fileUri, title, MIME);
    }

    const jsonRoutes = {
      test: '/quiz',
      match: '/matching',
      flash: '/flashcard',
      speach: '/SpeakGameScreen',
      sentence: '/CompleteSentenceGameScreen',
      gameIMGtext: '/AngleHuntScreen',
    };

    if (jsonRoutes[type]) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        router.push({
          pathname: jsonRoutes[type],
          params: {
            uri: fileInfo.exists ? localPath : content,
            title,
          },
        });
        console.log(`Loaded ${type} file at ${localPath}`);
      } catch (err) {
        console.error(`${type} load error:`, err);
        Alert.alert("Error", `Unable to open ${type}.`);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 0,
    },
    scrollContainer: { flexGrow: 1 },
    topCard: {
      backgroundColor: theme.navBackground,
      height: 120,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      padding: 20,
      paddingLeft: 20,
      paddingLeft: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 }, // Shadow at the bottom
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5, // For Android
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginLeft: 12,
      paddingRight: 30,
    },
    doneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#d0f3dfff',
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 10,
      marginLeft: 20,
    },
    doneText: { color: '#0eb85f', fontSize: 14, fontWeight: '600', marginLeft: 6 },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#b1dcfcff',
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 10,
      marginLeft: 10,
    },
    downloadText: { color: '#1486DE', fontSize: 14, fontWeight: '600', marginLeft: 6 },
    actionsRow: { flexDirection: 'row', alignItems: 'center' },
    bottomCard: {
      backgroundColor: theme.navBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      marginTop: 10,
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    detailText: { fontSize: 16, lineHeight: 24, color: theme.text, marginBottom: 12 },
    startButton: { backgroundColor: '#48cae4', borderRadius: 8, padding: 16, alignItems: 'center', marginHorizontal: 20 },
    startText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  });

  const embedUrl = getYouTubeEmbedUrl(content);

  const videoUri = fileExists ? file : content;

  const videoPlayer = useVideoPlayer(videoUri || undefined, (player) => {
    player.loop = false;
    player.pause();
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topCard}>
        <View style={styles.headerRow}>
          <Ionicons name={iconName} size={50} color={theme.text} />
          <ThemedText style={styles.title}>{title}</ThemedText>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.doneButton, !isDone && { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.cardBorder }]}
          onPress={handleMarkAsDone}
        >
          {isDone && <Ionicons name="checkmark-circle" size={20} color="#0eb85f" />}
          <ThemedText style={[styles.doneText, !isDone && { color: theme.text }]}>
            {isDone ? 'Done' : 'Mark as Done'}
          </ThemedText>
        </TouchableOpacity>

        {type !== "link" && type !== "general" && (
          <TouchableOpacity
            style={[styles.downloadButton, !fileExists && { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.cardBorder }]}
            onPress={handleMarkAsDownloaded}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Ionicons name="cloud-download" size={20} color="#1486DE" />
                <ThemedText style={styles.downloadText}>Downloading…</ThemedText>
              </>
            ) : (
              <>
                {fileExists && <Ionicons name="cloud-download" size={20} color="#1486DE" />}
                <ThemedText style={[styles.downloadText, !fileExists && { color: theme.text }]}>
                  {fileExists ? 'Available' : 'Download for offline use'}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomCard}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedText style={styles.detailText}>Short Description: {shortDescription}</ThemedText>
          <ThemedText style={styles.detailText}>Type: {type}</ThemedText>

          {type === 'video' && (
            videoUri ? (
              <VideoView
                style={{ width: '100%', height: 250, backgroundColor: 'black' }}
                player={videoPlayer}
                allowsFullscreen
                onFullscreenChange={async (isFullscreen) => {
                  await ScreenOrientation.lockAsync(
                    isFullscreen
                      ? ScreenOrientation.OrientationLock.LANDSCAPE
                      : ScreenOrientation.OrientationLock.PORTRAIT
                  );
                }}
              />
            ) : (
              <View style={{ width: '100%', height: 250, backgroundColor: 'grey' }} />
            )
          )}

          {type === 'link' && embedUrl && (
            <View style={{ flex: 1, height: 300 }}>
              <WebView source={{ uri: embedUrl }} javaScriptEnabled domStorageEnabled allowsFullscreenVideo startInLoadingState />
            </View>
          )}
        </ScrollView>

        {['pdf', 'ppt', 'pptx', 'test', 'match', 'flash', 'speach', 'sentence', 'gameIMGtext'].includes(type) && (
          <ThemedButton style={styles.startButton} onPress={handleOpen} disabled={downloading}>
            <ThemedText style={styles.startText}>{downloading ? 'Downloading…' : 'Open'}</ThemedText>
          </ThemedButton>
        )}

        <Spacer height={25} />
      </View>

      <DangerAlert
        visible={showDeleteAlert}
        message="Do you want to delete this offline file?"
        onCancel={() => setShowDeleteAlert(false)}
        onConfirm={async () => {
          setShowDeleteAlert(false);
          try {
            await FileSystem.deleteAsync(file, { idempotent: true });
            setFileExists(false);
          } catch (err) {
            console.error("Delete error:", err);
          }
        }}
      />
    </ThemedView>
  );
};

export default ContentDetails;

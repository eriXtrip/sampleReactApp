// app/(content_render)/content_details.jsx

import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Platform, Alert, PermissionsAndroid } from 'react-native';
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

const LESSONS_DIR = `${FileSystem.documentDirectory}Android/media/${Application.applicationId}/lesson_contents/`;

function getMimeType(uri) {
  const ext = uri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    default: return '*/*';
  }
}

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

const openWithChooser = async (uri, title) => {
  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(uri);
      const mimeType = getMimeType(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: mimeType,
        flags: 1,
      });
    } else {
      if (await Sharing.isAvailableAsync()) {
        const mimeType = getMimeType(uri);
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
  const { title, type, status, content, shortDescription } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const normalizeStatus = (val) => (val === true || val === "true" || val === "1");
  const [isDone, setIsDone] = useState(normalizeStatus(status));
  const [fileExists, setFileExists] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);


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

  // Check if file exists
  useEffect(() => {
    (async () => {
      if (!content) return;
      const fileName = content.split('/').pop();
      const targetUri = `${LESSONS_DIR}${fileName}`;
      try {
        const fileInfo = await FileSystem.getInfoAsync(targetUri);
        setFileExists(fileInfo.exists);
      } catch {
        setFileExists(false);
      }
    })();
  }, [content]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const fileName = content.split('/').pop();
      const targetUri = `${LESSONS_DIR}${fileName}`;
      const targetFolder = await ensureLessonsDir();
      if (!targetFolder) return;

      const fileInfo = await FileSystem.getInfoAsync(targetUri);
      if (fileInfo.exists) {
        setFileExists(true);
        setDownloading(false);
        return targetUri;
      }

      // Step 1: Download
      const tempUri = FileSystem.cacheDirectory + fileName;
      const { uri: downloadedUri } = await FileSystem.downloadAsync(content, tempUri);

      // ✅ If JSON-based type, parse and fix image references
      if (['test', 'match', 'flash', 'speach', 'sentence', 'gameIMGtext'].includes(type)) {
        const jsonString = await FileSystem.readAsStringAsync(downloadedUri);
        const parsed = JSON.parse(jsonString);

        // Case 1: JSON with "items"
        if (Array.isArray(parsed.items)) {
          for (let item of parsed.items) {
            if (item.questionType === "image" && item.question?.startsWith("http")) {
              const qName = item.question.split("/").pop();
              const qLocalUri = `${targetFolder}${qName}`;
              await FileSystem.downloadAsync(item.question, qLocalUri);
              item.question = qLocalUri;
            }

            if (Array.isArray(item.choices)) {
              for (let choice of item.choices) {
                if (choice.type === "image" && choice.img?.startsWith("http")) {
                  const cName = choice.img.split("/").pop();
                  const cLocalUri = `${targetFolder}${cName}`;
                  await FileSystem.downloadAsync(choice.img, cLocalUri);
                  choice.img = cLocalUri;
                }
              }
            }
          }
        }

        // Case 2: JSON with "questions"
        if (Array.isArray(parsed.questions)) {
          for (let q of parsed.questions) {
            // Example: if some future "question" field itself is an image URL
            if (q.type === "image" && q.question?.startsWith("http")) {
              const qName = q.question.split("/").pop();
              const qLocalUri = `${targetFolder}${qName}`;
              await FileSystem.downloadAsync(q.question, qLocalUri);
              q.question = qLocalUri;
            }

            if (Array.isArray(q.choices)) {
              for (let choice of q.choices) {
                if (choice.type === "image" && choice.img?.startsWith("http")) {
                  const cName = choice.img.split("/").pop();
                  const cLocalUri = `${targetFolder}${cName}`;
                  await FileSystem.downloadAsync(choice.img, cLocalUri);
                  choice.img = cLocalUri;
                }
              }
            }
          }
        }

        // Save updated JSON locally
        await FileSystem.writeAsStringAsync(targetUri, JSON.stringify(parsed));
      } else {
        // ✅ Non-JSON (pdf, ppt, etc.) → just copy file
        await FileSystem.copyAsync({ from: downloadedUri, to: targetUri });
      }

      // Step 2: Update state
      const newFileInfo = await FileSystem.getInfoAsync(targetUri);
      setFileExists(newFileInfo.exists);
      setDownloading(false);

      return targetUri;
    } catch (err) {
      setDownloading(false);
      console.error('Download error:', err);
      Alert.alert('Error', err.message);
      return null;
    }
  };


  const handleMarkAsDone = () => {
    const newState = !isDone;
    setIsDone(newState);
    router.setParams({ status: newState ? "true" : "false" });
  };

  const handleMarkAsDownloaded = async () => {
    const fileName = content.split('/').pop();
    const targetUri = `${LESSONS_DIR}${fileName}`;

    if (fileExists) {
    // Show custom DangerAlert
    setShowDeleteAlert(true);
    } else {
      // Not saved → download
      await handleDownload();
    }
  };

  const handleOpen = async () => {
    // PDFs & PPTs
    if (['pdf', 'ppt', 'pptx'].includes(type)) {
      let fileUri = null;
      if (!fileExists) fileUri = await handleDownload();
      else {
        const fileName = content.split('/').pop();
        fileUri = `${LESSONS_DIR}${fileName}`;
      }
      if (fileUri) await openWithChooser(fileUri, title);
    }

    // Quiz (JSON file)
    if (type === 'test') {
      try {
        const fileName = content ? content.split('/').pop() : "quiz.json";
        const targetUri = `${LESSONS_DIR}${fileName}`;

        // check if offline file exists
        const fileInfo = await FileSystem.getInfoAsync(targetUri);

        router.push({
          pathname: '/quiz',
          params: { 
            quizUri: fileInfo.exists ? targetUri : content, // 📂 offline if available, else online
            title,
          },
        });
      } catch (err) {
        console.error("Quiz load error:", err);
        Alert.alert("Error", "Unable to open quiz.");
      }
    }

    // Matching (JSON file)
    if (type === 'match') {
      try {
        const fileName = content ? content.split('/').pop() : "matching.json";
        const targetUri = `${LESSONS_DIR}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(targetUri);

        router.push({
          pathname: '/matching',
          params: { 
            matchingUri: fileInfo.exists ? targetUri : content, 
            title,
          },
        });
      } catch (err) {
        console.error("Matching load error:", err);
        Alert.alert("Error", "Unable to open matching game.");
      }
    }

    // Flashcard (JSON file)
    if (type === 'flash') {
      try {
        const fileName = content ? content.split('/').pop() : "flashcard.json";
        const targetUri = `${LESSONS_DIR}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(targetUri);

        router.push({
          pathname: '/flashcard',
          params: { 
            flashcardUri: fileInfo.exists ? targetUri : content, 
            title,
          },
        });
      } catch (err) {
        console.error("Flashcard load error:", err);
        Alert.alert("Error", "Unable to open flashcard.");
      }
    }

    // speach (JSON file)
    if (type === 'speach') {
      try {
        const fileName = content ? content.split('/').pop() : "speach.json";
        const targetUri = `${LESSONS_DIR}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(targetUri);

        router.push({
          pathname: '/SpeakGameScreen',
          params: { 
            speakUri: fileInfo.exists ? targetUri : content, 
            title,
          },
        });
      } catch (err) {
        console.error("Speak load error:", err);
        Alert.alert("Error", "Unable to open speak.");
      }
    }

    // spell (JSON file)
    if (type === 'sentence') {
      try {
        const fileName = content ? content.split('/').pop() : "spell.json";
        const targetUri = `${LESSONS_DIR}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(targetUri);

        router.push({
          pathname: '/CompleteSentenceGameScreen',
          params: { 
            spellUri: fileInfo.exists ? targetUri : content, 
            title,
          },
        });
      } catch (err) {
        console.error("Spell load error:", err);
        Alert.alert("Error", "Unable to open speel.");
      }
    }

    // gameIMGtext (JSON file)
    if (type === 'gameIMGtext') {
      try {
        const fileName = content ? content.split('/').pop() : "gameIMGtext.json";
        const targetUri = `${LESSONS_DIR}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(targetUri);

        router.push({
          pathname: '/AngleHuntScreen',
          params: { 
            mathUri: fileInfo.exists ? targetUri : content, 
            title,
          },
        });
      } catch (err) {
        console.error("Math load error:", err);
        Alert.alert("Error", "Unable to open math json.");
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

  const videoUri = content ? 
  (fileExists ? `${LESSONS_DIR}${content.split('/').pop()}` : content) 
  : null;

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
          style={[
            styles.doneButton,
            !isDone && { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.cardBorder },
          ]}
          onPress={handleMarkAsDone}
        >
          {isDone && <Ionicons name="checkmark-circle" size={20} color="#0eb85f" />}
          <ThemedText style={[styles.doneText, !isDone && { color: theme.text }]}>
            {isDone ? 'Done' : 'Mark as Done'}
          </ThemedText>
        </TouchableOpacity>

          {type !== "link" && type !== "general" && (
            <TouchableOpacity
              style={[
                styles.downloadButton,
                !fileExists && { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.cardBorder },
              ]}
              onPress={handleMarkAsDownloaded}
              disabled={downloading} // disable while downloading
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
            const fileName = content.split('/').pop();
            const targetUri = `${LESSONS_DIR}${fileName}`;
            await FileSystem.deleteAsync(targetUri, { idempotent: true });
            setFileExists(false);
            // Optionally also show a ThemedAlert after deletion
          } catch (err) {
            console.error("Delete error:", err);
          }
        }}
      />
    </ThemedView>
  );
};

export default ContentDetails;

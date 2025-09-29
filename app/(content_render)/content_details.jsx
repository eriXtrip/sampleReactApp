import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSQLiteContext } from 'expo-sqlite';
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
import { resolveLocalPath } from '../../utils/resolveLocalPath';
import { handleDownload } from '../../utils/handleDownload';
import { handleDelete } from '../../utils/handleDelete';
import { LESSON_TYPE_ICON_MAP } from '../../data/lessonData';

const ContentDetails = () => {
  const { id, title, type, shortdescription, content, file, status} = useLocalSearchParams();
  console.log('Content Details Params:', { id, title, type, shortdescription, content, file, status });
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const normalizeStatus = (val) => (val === true || val === "true" || val === "1");
  const [isDone, setIsDone] = useState(normalizeStatus(status));
  const [fileExists, setFileExists] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [embedFailed, setEmbedFailed] = useState(false);

  const db = useSQLiteContext();

  const [contents, setContents] = useState([]);

  // --- MIME detection ---
  const getMimeType = (filename) => {
    if (!filename) return '*/*';
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'ppt': return 'application/vnd.ms-powerpoint';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'mp4': return 'video/mp4';
      case 'json': return 'application/json';
      case 'txt': return 'text/plain';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return '*/*';
    }
  };

  useEffect(() => {
      if (!id) return;

      const fetchContents = async () => {
        try {
          const result = await db.getAllAsync(
            `SELECT * FROM subject_contents WHERE content_id = ?`,
            [id]
          );
          console.log("Fetched contents ✅:", result);
          
          if (result.length > 0) {
            const item = result[0];
            setContents(result);
            setIsDone(item.done === 1);
            setFileExists(await FileSystem.getInfoAsync(resolveLocalPath(item.file_name)).then(f => f.exists));
          }

        } catch (err) {
          console.error("❌ Error fetching contents:", err);
        }
      };

      fetchContents();
    }, [id]);

    console.log("Current contents state:", contents);


  

  // Fallback timer
  // useEffect(() => {
  //   if (!embedFailed && type === 'url' && embedUrl) {
  //     const timeout = setTimeout(() => {
  //       console.log('Embed failed, switching to content URL');
  //       setEmbedFailed(true);
  //     }, 3000); // 3 seconds
  //     return () => clearTimeout(timeout);
  //   }
  // }, [embedFailed, embedUrl]);

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

  const handleMarkAsDone = async () => {
    if (!contents.length) return;

    const { content_id } = contents[0];
    const newState = !isDone;
    setIsDone(newState);

    try {
      const now = newState ? new Date().toISOString() : null;
      await db.runAsync(
        `UPDATE subject_contents 
        SET done = ?, completed_at = ? 
        WHERE content_id = ?`,
        [newState ? 1 : 0, now, content_id]
      );
      console.log(`✅ Updated done=${newState}, completed_at=${now} for content_id ${content_id}`);
    } catch (err) {
      console.error("❌ Error updating done/completed_at:", err);
    }

    router.setParams({ status: newState ? "true" : "false" });
  };

  const handleMarkAsDownloaded = async () => {
    if (!contents.length) return;

    const item = contents[0];

    if (fileExists) {
      setShowDeleteAlert(true);
    } else {
      try {
        const fileUri = await handleDownload(
          item.file_name,
          item.url,
          item.content_type,
          setFileExists,
          setDownloading
        );

        if (fileUri) {
          const now = new Date().toISOString();
          await db.runAsync(
            `UPDATE subject_contents 
            SET downloaded_at = ? 
            WHERE content_id = ?`,
            [now, item.content_id]
          );
          console.log(`✅ Updated downloaded_at for content_id ${item.content_id}: ${now}`);
        }
      } catch (err) {
        console.error("❌ Error marking as downloaded:", err);
      }
    }
  };

  const handleOpen = async () => {
    if (!contents.length) return;

    const { content_id, file_name, url, content_type, title } = contents[0];
    const localPath = resolveLocalPath(file_name);
    const mimeType = getMimeType(file_name);

    try {
    // --- update last_accessed column in subject_contents ---
    const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE subject_contents 
        SET last_accessed = ? 
        WHERE content_id = ?`,
        [now, content_id]
      );
      console.log(`✅ Updated last_accessed for content_id ${content_id}: ${now}`);
    } catch (err) {
      console.error("❌ Error updating last_accessed:", err);
    }

    // --- For documents (pdf, ppt, pptx) ---
    if (['pdf', 'ppt', 'pptx'].includes(content_type)) {
      let fileUri = null;
      if (!fileExists) {
        fileUri = await handleDownload(file_name, url, content_type, setFileExists, setDownloading);
      } else {
        fileUri = localPath;
      }
      if (fileUri) await openWithChooser(fileUri, title, mimeType);
      return;
    }

    // --- For interactive/game JSON routes ---
    const jsonRoutes = {
      quiz: '/quiz',
      game_match: '/matching',
      game_flash: '/flashcard',
      game_speak: '/SpeakGameScreen',
      game_comp: '/CompleteSentenceGameScreen',
      game_img: '/AngleHuntScreen',
    };

    if (jsonRoutes[content_type]) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        const actualUri = fileInfo.exists ? localPath : url;
        router.push({
          pathname: jsonRoutes[content_type],
          params: { uri: actualUri, title },
        });
        console.log(`Loaded ${content_type} at ${actualUri}`);
      } catch (err) {
        console.error(`${content_type} load error:`, err);
        Alert.alert("Error", `Unable to open ${content_type}.`);
      }
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
      paddingLeft: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
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

  const embedUrl = getYouTubeEmbedUrl(contents[0]?.url);
  console.log('Embed URL:', embedUrl);
  
  
  const videoUri = fileExists ? resolveLocalPath(file) : content;

  const videoPlayer = useVideoPlayer(videoUri || undefined, (player) => {
    player.loop = false;
    player.pause();
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topCard}>
        <View style={styles.headerRow}>
          <Ionicons name={LESSON_TYPE_ICON_MAP[type] || 'book-outline'} size={50} color={theme.text} />
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

        {contents[0]?.content_type !== "url" && contents[0]?.content_type !== "general" && (
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
          <ThemedText style={styles.detailText}>Short Description: {shortdescription}</ThemedText>

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

          {type === 'url' && !embedFailed && embedUrl && (
            <WebView
              source={{ uri: embedUrl }}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              startInLoadingState
            />
          )}

          {type === 'url' && embedFailed && (
            <WebView
              source={{ uri: content }}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              startInLoadingState
            />
          )}

        </ScrollView>

        {['pdf', 'ppt', 'pptx', 'test', 'match', 'flash', 'speach', 'sentence', 'gameIMGtext']
          .includes(contents[0]?.content_type) && (
          <ThemedButton style={styles.startButton} onPress={handleOpen} disabled={downloading}>
            <ThemedText style={styles.startText}>
              {downloading ? 'Downloading…' : 'Open'}
            </ThemedText>
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
          const success = await handleDelete(contents[0]?.file_name, contents[0]?.content_type, setFileExists);
          if (!success) {
            Alert.alert("Error", "Failed to delete the file or associated images. Please try again.");
          }
        }}
      />
    </ThemedView>
  );
};

export default ContentDetails;
// app/(content_render)/content_details_test.jsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as Application from 'expo-application';

// Define the lessons folder path (same as in _layout.jsx)
const LESSONS_DIR = `${
  FileSystem.documentDirectory
}Android/media/${Application.applicationId}/lesson_contents/`;

// Simple MIME resolver
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

// Ensure lesson_contents folder exists
const ensureLessonsDir = async () => {
  try {
    console.log('🔍 Checking lessons folder:', LESSONS_DIR);
    if (!LESSONS_DIR) {
      throw new Error('LESSONS_DIR is undefined or invalid');
    }
    const dirInfo = await FileSystem.getInfoAsync(LESSONS_DIR);
    console.log('ℹ️ Dir exists?', dirInfo.exists);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LESSONS_DIR, { intermediates: true });
      console.log('✅ Created lessons folder:', LESSONS_DIR);
    } else {
      console.log('📂 Lessons folder already exists');
    }
    return LESSONS_DIR;
  } catch (e) {
    console.error('❌ Error creating lessons folder:', e);
    Alert.alert('Error', 'Failed to create lessons folder. Cannot save files.');
    return null;
  }
};

export default function ContentDetails() {
  const { title, type, status, content, shortDescription } = useLocalSearchParams();
  const [downloading, setDownloading] = useState(false);
  const [fileExists, setFileExists] = useState(false);

  // Check if the file already exists in LESSONS_DIR
  useEffect(() => {
    (async () => {
      const fileName = content.split('/').pop();
      const targetUri = `${LESSONS_DIR}${fileName}`;
      try {
        const fileInfo = await FileSystem.getInfoAsync(targetUri);
        setFileExists(fileInfo.exists);
        console.log('📄 File exists:', fileInfo.exists, 'Path:', targetUri);
      } catch (err) {
        console.error('Error checking file existence:', err);
        setFileExists(false);
      }
    })();
  }, [content]);

  const openWithChooser = async (uri) => {
    try {
      if (Platform.OS === 'android') {
        // Convert file:// URI to content:// URI
        const contentUri = await FileSystem.getContentUriAsync(uri);
        console.log('📎 Content URI:', contentUri); // Log for debugging
        const mimeType = getMimeType(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } else {
        // On iOS, use Sharing.shareAsync to open directly
        if (await Sharing.isAvailableAsync()) {
          const mimeType = getMimeType(uri);
          await Sharing.shareAsync(uri, { mimeType, dialogTitle: title, UTI: mimeType });
        } else {
          Alert.alert('Not supported', 'Opening files is not available on this device.');
        }
      }
    } catch (err) {
      console.error('Open file error:', err);
      Alert.alert('Error', 'No app found to open this file. Please install a compatible app (e.g., a PDF viewer).');
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const fileName = content.split('/').pop();
      const targetUri = `${LESSONS_DIR}${fileName}`;

      // Ensure lesson_contents folder exists
      const targetFolder = await ensureLessonsDir();
      if (!targetFolder) {
        setDownloading(false);
        return;
      }

      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(targetUri);
      if (fileInfo.exists) {
        console.log('📄 File already exists, skipping download:', targetUri);
        setDownloading(false);
        await openWithChooser(targetUri);
        return;
      }

      // Download to cache first
      const tempUri = FileSystem.cacheDirectory + fileName;
      const { uri: downloadedUri } = await FileSystem.downloadAsync(content, tempUri);

      // Move file to LESSONS_DIR
      await FileSystem.moveAsync({
        from: downloadedUri,
        to: targetUri,
      });

      // Verify file was saved
      const newFileInfo = await FileSystem.getInfoAsync(targetUri);
      console.log('📄 File saved:', newFileInfo.exists, 'Path:', targetUri);
      setFileExists(newFileInfo.exists);

      Alert.alert('Download complete', `Saved to lesson_contents as ${fileName}`);
      setDownloading(false);

      // Open with system chooser
      await openWithChooser(targetUri);
    } catch (err) {
      setDownloading(false);
      console.error('Download error:', err);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>{title}</Text>
      <Text style={{ marginBottom: 16 }}>{shortDescription}</Text>

      <TouchableOpacity
        onPress={handleDownload}
        style={{ backgroundColor: '#4a90e2', padding: 12, borderRadius: 6 }}
        disabled={downloading}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {downloading ? 'Downloading…' : fileExists ? 'Open' : 'Open / Download'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
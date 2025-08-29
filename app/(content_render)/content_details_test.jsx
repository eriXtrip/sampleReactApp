import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function ContentDetails() {
  const { title, type, status, content, shortDescription } = useLocalSearchParams();
  const [downloading, setDownloading] = useState(false);
  const [folderUri, setFolderUri] = useState(null);

  // Load saved folder URI from AsyncStorage
  useEffect(() => {
    (async () => {
      const savedUri = await AsyncStorage.getItem('lesson_contents_uri');
      if (savedUri) setFolderUri(savedUri);
    })();
  }, []);

  const ensureFolder = async () => {
    if (folderUri) return folderUri;

    // Ask user to pick Downloads (or another folder)
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      Alert.alert('Permission required', 'Please select a folder to save files.');
      return null;
    }

    // Create "lesson_contents" subfolder
    const newDirUri = await FileSystem.StorageAccessFramework.createDirectoryAsync(
      permissions.directoryUri,
      'lesson_contents'
    );

    await AsyncStorage.setItem('lesson_contents_uri', newDirUri);
    setFolderUri(newDirUri);
    return newDirUri;
  };

  const openWithChooser = async (uri) => {
    if (Platform.OS === 'android') {
      try {
        const mimeType = getMimeType(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: uri,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } catch (err) {
        console.error('Intent error:', err);
        Alert.alert('Error', 'No app found to open this file.');
      }
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Not supported on this device');
      }
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const fileName = content.split('/').pop();
      const tempUri = FileSystem.cacheDirectory + fileName;

      // Download to cache
      const { uri: downloadedUri } = await FileSystem.downloadAsync(content, tempUri);

      // Ensure lesson_contents folder exists
      const targetFolder = await ensureFolder();
      if (!targetFolder) {
        setDownloading(false);
        return;
      }

      // Create file inside lesson_contents
      const mimeType = getMimeType(fileName);
      const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        targetFolder,
        fileName,
        mimeType
      );

      // Copy file contents
      const base64 = await FileSystem.readAsStringAsync(downloadedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(newFileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('Download complete', `Saved to lesson_contents as ${fileName}`);

      setDownloading(false);

      // Open with system chooser
      await openWithChooser(newFileUri);
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
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {downloading ? 'Downloading…' : 'Open / Download'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

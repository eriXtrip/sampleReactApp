// utils/fileHelper.js
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function ensureLessonFile(localAsset, fileName) {
  // Make sure the asset is available locally
  const asset = Asset.fromModule(localAsset);
  await asset.downloadAsync();

  // Destination inside your app's sandbox
  const dest = `${FileSystem.documentDirectory}${fileName}`;

  const info = await FileSystem.getInfoAsync(dest);
  if (!info.exists) {
    await FileSystem.copyAsync({
      from: asset.localUri,
      to: dest,
    });
  }

  return dest; // returns file:// URI
}

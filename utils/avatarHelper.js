// utils/avatarHelper.js
import * as FileSystem from 'expo-file-system';

const AVATAR_DIR = `${FileSystem.documentDirectory}Android/media/com.anonymous.MQuest/avatars/`;

export const getLocalAvatarPath = (fileName) => {
  if (!fileName) return null;
  return `${AVATAR_DIR}${fileName}`;
};

export const ensureAvatarDirectory = async () => {
  await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
};
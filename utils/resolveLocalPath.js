// utils/resolveLocalPath.js

import * as FileSystem from "expo-file-system";
import * as Application from "expo-application";

export const LESSONS_DIR = `${FileSystem.documentDirectory}Android/media/${Application.applicationId}/lesson_contents/`;

export const resolveLocalPath = (fileName) => {
  return `${LESSONS_DIR}${fileName}`;
};

export const ensureLessonsDir = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(LESSONS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LESSONS_DIR, { intermediates: true });
    }
    return LESSONS_DIR;
  } catch (e) {
    console.error('❌ Error creating lessons folder:', e);
    return null;
  }
};

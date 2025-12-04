// utils/handleDownload.js

import * as FileSystem from 'expo-file-system';
import { resolveLocalPath, ensureLessonsDir } from './resolveLocalPath';
import { 
  showLoadingToast, 
  dismissLoadingToast,
  triggerLocalNotification,
  showSuccessToast,
  showErrorToast 
} from './notificationUtils';

// Download the main file and associated images for JSON-based content
export const handleDownload = async (file, title, content, type, setFileExists, setDownloading, lesson_bellonId, db) => {
   let loadingToastId = null;

  try {
    setDownloading(true);

    // Show loading toast initially
    loadingToastId = showLoadingToast('Downloading', `${title} is being downloaded...`);

    const targetFolder = await ensureLessonsDir();
    if (!targetFolder) return null;

    const localPath = resolveLocalPath(file);
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      setFileExists(true);
      setDownloading(false);
      console.log("Already exists ✅:", localPath);
      
      // Dismiss loading and show info
      if (loadingToastId) dismissLoadingToast(loadingToastId);
      triggerLocalNotification('Already downloaded', title, 'info');

      return localPath;
    }

    // Step 1: Download into cache first
    const tempUri = FileSystem.cacheDirectory + file;
    const { uri: downloadedUri } = await FileSystem.downloadAsync(content, tempUri);
    console.log("Downloaded main file ✅:", file);
    

    // Step 2: Handle JSON or normal file
    if (['quiz', 'game_match', 'game_flash', 'game_speak', 'game_comp', 'game_img'].includes(type)) {
      const jsonString = await FileSystem.readAsStringAsync(downloadedUri);
      const parsed = JSON.parse(jsonString);

      // Case 1: JSON with "items"
      if (Array.isArray(parsed.items)) {
        for (let item of parsed.items) {
          if (item.questionType === "image" && item.question?.startsWith("http") && item.file) {
            const qLocalUri = resolveLocalPath(item.file);
            const qFileInfo = await FileSystem.getInfoAsync(qLocalUri);
            if (!qFileInfo.exists) {
              await FileSystem.downloadAsync(item.question, qLocalUri);
              console.log("Downloaded question image ✅:", item.file);
            } else {
              console.log("Question image already exists ✅:", item.file);
            }
            item.img = item.question; // Preserve original URL
            item.question = qLocalUri;
          }

          if (Array.isArray(item.choices)) {
            for (let choice of item.choices) {
              if (choice.type === "image" && choice.img?.startsWith("http") && choice.file) {
                const cLocalUri = resolveLocalPath(choice.file);
                const cFileInfo = await FileSystem.getInfoAsync(cLocalUri);
                if (!cFileInfo.exists) {
                  await FileSystem.downloadAsync(choice.img, cLocalUri);
                  console.log("Downloaded choice image ✅:", choice.file);
                } else {
                  console.log("Choice image already exists ✅:", choice.file);
                }
                choice.originalImg = choice.img; // Preserve original URL
                choice.img = cLocalUri;
              }
            }
          }
        }
      }

      // Case 2: JSON with "questions"
      if (Array.isArray(parsed.questions)) {
        for (let q of parsed.questions) {
          if (q.type === "image" && q.question?.startsWith("http") && q.file) {
            const qLocalUri = resolveLocalPath(q.file);
            const qFileInfo = await FileSystem.getInfoAsync(qLocalUri);
            if (!qFileInfo.exists) {
              await FileSystem.downloadAsync(q.question, qLocalUri);
              console.log("Downloaded question image ✅:", q.file);
            } else {
              console.log("Question image already exists ✅:", q.file);
            }
            q.img = q.question; // Preserve original URL
            q.question = qLocalUri;
          }

          if (Array.isArray(q.choices)) {
            for (let choice of q.choices) {
              if (choice.type === "image" && choice.img?.startsWith("http") && choice.file) {
                const cLocalUri = resolveLocalPath(choice.file);
                const cFileInfo = await FileSystem.getInfoAsync(cLocalUri);
                if (!cFileInfo.exists) {
                  await FileSystem.downloadAsync(choice.img, cLocalUri);
                  console.log("Downloaded choice image ✅:", choice.file);
                } else {
                  console.log("Choice image already exists ✅:", choice.file);
                }
                choice.originalImg = choice.img; // Preserve original URL
                choice.img = cLocalUri;
              }
            }
          }
        }
      }

      // Save updated JSON locally
      await FileSystem.writeAsStringAsync(localPath, JSON.stringify(parsed));
      console.log("Saved updated JSON ✅:", file);
    } else {
      // Non-JSON files
      await FileSystem.copyAsync({ from: downloadedUri, to: localPath });
      console.log("Saved non-JSON file ✅:", file);
    }

    if (db && lesson_bellonId) {

        console.log("Updating lesson no_of_contents for lesson_id=", lesson_bellonId);
      try {
        await db.runAsync(
          `UPDATE lessons
          SET no_of_contents = COALESCE(no_of_contents, 0) + 1,
              is_downloaded = 1
          WHERE lesson_id = ?`,
          [lesson_bellonId]
        );
        console.log(`✅ Incremented no_of_contents for lesson_id=${lesson_bellonId}`);
      } catch (err) {
        console.warn('Failed to update lesson no_of_contents:', err);
      }
    }

    if(file){
      try{
        const now = new Date().toISOString();

        await db.runAsync(
          `UPDATE subject_contents
          SET downloaded = 1, downloaded_at = ?
          WHERE file_name = ?`,
          [now, file]
        );
        console.log("Success updating subject_contents.");
      } catch (err){
        console.warn('Failed to update subject_contents:', err);
      }
    }

    // When download is complete
    if (loadingToastId) dismissLoadingToast(loadingToastId);
    showSuccessToast('Success!', `${title} downloaded successfully!`);

    setFileExists(true);
    setDownloading(false);
    console.log("Final path:", localPath);
    return localPath;
  } catch (err) {
    setDownloading(false);
    console.error("Download error:", err);
    
    // Dismiss loading and show error
    if (loadingToastId) dismissLoadingToast(loadingToastId);
    showErrorToast('Download Failed', 'Please try again');

    return null;
  }
};
// utils/handleDelete.js

import * as FileSystem from 'expo-file-system';
import { resolveLocalPath } from './resolveLocalPath';

export const handleDelete = async (file, type, setFileExists, lesson_bellonId, db) => {
  try {
    if (!file) {
      console.error("File is undefined");
      return false;
    }
    const localPath = resolveLocalPath(file);

    // Process associated image files if type is "gameIMGtext"
    if (type === "game_img") {
      try {
        const jsonString = await FileSystem.readAsStringAsync(localPath);
        const jsonData = JSON.parse(jsonString);

        // Collect all local image file paths from the JSON
        const imageFiles = [];
        jsonData.items?.forEach((item) => {
          if (item.file) imageFiles.push(item.file);
          item.choices?.forEach((choice) => {
            if (choice.file) imageFiles.push(choice.file);
          });
        });

        // Delete associated image files
        for (const imageFile of imageFiles) {
          const imagePath = resolveLocalPath(imageFile);
          await FileSystem.deleteAsync(imagePath, { idempotent: true });
          console.log(`Successfully deleted associated image file: ${imagePath}`);
        }
      } catch (err) {
        console.error("Error reading or parsing JSON for image deletion:", err);
      }
    }

    // Update the database to decrement no_of_contents
    if (db && lesson_bellonId) {
      try {
        await db.runAsync(
          `UPDATE lessons
          SET no_of_contents = COALESCE(no_of_contents, 0) - 1
          WHERE lesson_id = ?`,
          [lesson_bellonId]
        );
        console.log(`✅ Deccremented no_of_contents for lesson_id=${lesson_bellonId}`);
      } catch (err) {
        console.warn('Failed to update lesson no_of_contents:', err);
      }
    }

    if(file){
      try{

        await db.runAsync(
          `UPDATE subject_contents
          SET downloaded = 0
          WHERE file_name = ?`,
          [file]
        );
        console.log("Success updating subject_contents.");
      } catch (err){
        console.warn('Failed to update subject_contents:', err);
      }
    }

    // Delete the JSON file
    await FileSystem.deleteAsync(localPath, { idempotent: true });
    console.log(`Successfully deleted JSON file: ${localPath}`);
    setFileExists(false);
    return true;
  } catch (err) {
    console.error("Delete error:", err);
    return false;
  }
};
// utils/handleDelete.js

import * as FileSystem from 'expo-file-system';
import { resolveLocalPath } from './resolveLocalPath';

export const handleDelete = async (file, type, setFileExists) => {
  try {
    if (!file) {
      console.error("File is undefined");
      return false;
    }
    const localPath = resolveLocalPath(file);

    // Process associated image files if type is "gameIMGtext"
    if (type === "gameIMGtext") {
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
// my-app-backend/controllers/driveController.js

import { google } from 'googleapis';
import fs from 'fs';
import fsPromises from 'fs/promises';
import config from '../config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const folder = 'MQuest_Contents';

// Google Drive API setup
const oauth2Client = new google.auth.OAuth2(
  config.googleClientId,
  config.googleClientSecret,
  config.googleRedirectUri
);
oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Setup upload directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../Uploads');
fsPromises.mkdir(uploadDir, { recursive: true }).catch(err => {
  console.error('Failed to create uploads directory:', err);
});

// Setup log directory
const logDir = path.join(__dirname, '../log');
const logFilePath = path.join(logDir, 'gdrive_log.txt');
fsPromises.mkdir(logDir, { recursive: true }).catch(err => {
  console.error('Failed to create log directory:', err);
});

// Logger function to write to gdrive_log.txt
const logToFile = async ({ filename, fileId, url, type }) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${type} - File: ${filename}, ID: ${fileId}, URL: ${url || 'N/A'}\n`;
  try {
    await fsPromises.appendFile(logFilePath, logMessage, 'utf8');
    console.log(logMessage.trim()); // Optional: keep console output for debugging
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

// Ensure folder exists or create it
const ensureDriveFolder = async (folderName, parentId = null) => {
  // Search for the folder by name
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  const res = await drive.files.list({
    q: parentId ? `${query} and '${parentId}' in parents` : query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id; // Folder already exists
  }

  // Otherwise create new folder
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) fileMetadata.parents = [parentId];

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });

  return folder.data.id;
};

// ✅ helper to verify file belongs to target folder
const ensureFileInFolder = async (fileId, folderName) => {
  const folderId = await ensureDriveFolder(folderName);

  const fileInfo = await drive.files.get({
    fileId,
    fields: 'id, name, parents, mimeType',
    supportsAllDrives: true,
  });

  if (!fileInfo.data.parents || !fileInfo.data.parents.includes(folderId)) {
    throw new Error(`File is not inside the ${folderName} folder`);
  }

  return fileInfo;
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Ensure target folder exists (or create it)
    const folderId = await ensureDriveFolder(folder); // change folder name here

    const filePath = req.file.path;
    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        parents: [folderId],  // ✅ save file inside the folder
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(filePath),
      },
      fields: 'id, name, mimeType,parents',
      supportsAllDrives: true,
    });

    await fsPromises.unlink(filePath);

    await logToFile({
      filename: response.data.name,
      fileId: response.data.id,
      type: 'upload',
    });

    res.json({
      success: true,
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
      parents: folderId,
    });
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
    if (req.file) await fsPromises.unlink(req.file.path);
    res.status(500).json({ success: false, error: err.response?.data?.error || err.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // ✅ Ensure file belongs to MQuest_Contents folder
    const fileInfo = await ensureFileInFolder(fileId, folder);

    const response = await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });

    await logToFile({
      filename: fileInfo.data.name || 'Unknown',
      fileId,
      type: 'delete',
    });

    res.json({ success: true, status: response.status });
  } catch (err) {
    console.error('Delete error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const shareFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // ✅ Ensure file belongs to MQuest_Contents folder
    const fileInfo = await ensureFileInFolder(fileId, folder);

    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone', allowFileDiscovery: true },
      supportsAllDrives: true,
    });

    const result = await drive.files.get({
      fileId,
      fields: 'webViewLink',
      supportsAllDrives: true,
    });

    await logToFile({
      filename: fileInfo.data.name || 'Unknown',
      fileId,
      url: result.data.webViewLink,
      type: 'public_URL',
    });

    res.json({
      success: true,
      name: fileInfo.data.name,
      mimeType: fileInfo.data.mimeType,
      webViewLink: result.data.webViewLink,
    });
  } catch (err) {
    console.error('Share error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const generateDownloadLink = async (req, res) => {
  try {
    const fileId = req.params.id;

    // ✅ Ensure file belongs to MQuest_Contents folder
    const fileInfo = await ensureFileInFolder(fileId, folder);

    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone', allowFileDiscovery: true },
      supportsAllDrives: true,
    });

    const result = await drive.files.get({
      fileId,
      fields: 'webContentLink',
      supportsAllDrives: true,
    });

    await logToFile({
      filename: fileInfo.data.name || 'Unknown',
      fileId,
      url: result.data.webContentLink,
      type: 'download_URL',
    });

    res.json({
      success: true,
      name: fileInfo.data.name,
      mimeType: fileInfo.data.mimeType,
      webContentLink: result.data.webContentLink,
    });
  } catch (err) {
    console.error('Download link error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getFileMetadata = async (req, res) => {
  try {
    const fileId = req.params.id;

    // ✅ Ensure file belongs to MQuest_Contents folder
    const fileInfo = await ensureFileInFolder(fileId, folder);

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime',
      supportsAllDrives: true,
    });

    await logToFile({
      filename: response.data.name || 'Unknown',
      fileId,
      type: 'metadata',
    });

    res.json({
      success: true,
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
      size: response.data.size,
      createdTime: response.data.createdTime,
      modifiedTime: response.data.modifiedTime,
    });
  } catch (err) {
    console.error('Metadata error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
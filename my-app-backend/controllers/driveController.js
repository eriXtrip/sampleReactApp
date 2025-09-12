// my-app-backend/controllers/driveController.js

import { google } from 'googleapis';
import fs from 'fs';
import fsPromises from 'fs/promises';
import config from '../config.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(filePath),
      },
      fields: 'id, name, mimeType',
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
    const fileInfo = await drive.files.get({
      fileId,
      fields: 'name',
      supportsAllDrives: true,
    });

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
    res.status(500).json({ success: false, error: err.response?.data?.error || err.message });
  }
};

export const shareFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileInfo = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
      supportsAllDrives: true,
    });

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: true,
      },
      supportsAllDrives: true,
      fields: 'id',
    });

    const result = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
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
      webContentLink: result.data.webContentLink,
    });
  } catch (err) {
    console.error('Share error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data?.error || err.message });
  }
};

export const generateDownloadLink = async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileInfo = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
      supportsAllDrives: true,
    });

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: true,
      },
      supportsAllDrives: true,
      fields: 'id',
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
    res.status(500).json({ success: false, error: err.response?.data?.error || err.message });
  }
};

export const getFileMetadata = async (req, res) => {
  try {
    const fileId = req.params.id;
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
    res.status(500).json({ success: false, error: err.response?.data?.error || err.message });
  }
};
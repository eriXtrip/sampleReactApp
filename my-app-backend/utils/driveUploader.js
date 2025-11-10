// my-app-backend/utils/driveUploader.js
import fs from 'fs';
import fsPromises from 'fs/promises';
import { google } from 'googleapis';
import config from '../config.js';

const folder = 'MQuest_Contents';

const oauth2Client = new google.auth.OAuth2(
  config.googleClientId,
  config.googleClientSecret,
  config.googleRedirectUri
);
oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const ensureDriveFolder = async (folderName) => {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  const res = await drive.files.list({ q: query, fields: 'files(id, name)', spaces: 'drive' });
  if (res.data.files.length > 0) return res.data.files[0].id;

  const folderMeta = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  const folderRes = await drive.files.create({
    requestBody: folderMeta,
    fields: 'id'
  });
  return folderRes.data.id;
};

export const uploadToDrive = async (file) => {
  try {
    console.log('[DRIVE] Starting upload:', file?.originalname || file?.path);

    if (!file) return null;

    const folderId = await ensureDriveFolder(folder);

    // Upload file
    const uploadRes = await drive.files.create({
      requestBody: {
        name: file.originalname,
        mimeType: file.mimetype,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },
      fields: 'id, name, mimeType',
    });

    console.log('[DRIVE] File uploaded to Drive, ID:', uploadRes.data.id);

    const fileId = uploadRes.data.id;

    // Make public
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    // Fetch complete metadata
    const metaRes = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, webContentLink, webViewLink, createdTime, modifiedTime',
    });

    // Delete local temp file
    try {
      await fsPromises.unlink(file.path);
      console.log('[DRIVE] Local file deleted:', file.path);
    } catch (unlinkErr) {
      console.warn('[DRIVE] Failed to delete local file:', unlinkErr.message);
    }

    // ✅ Return full metadata object
    return {
      id: metaRes.data.id,
      name: metaRes.data.name,
      mimeType: metaRes.data.mimeType,
      size: metaRes.data.size,
      createdTime: metaRes.data.createdTime,
      modifiedTime: metaRes.data.modifiedTime,
      webViewLink: metaRes.data.webViewLink,
      webContentLink: metaRes.data.webContentLink,
    };
  } catch (err) {
    console.error('DRIVE UPLOAD FAILED:');
    console.error('Message:', err.message);
    if (err.response?.data) {
      console.error('API Response:', JSON.stringify(err.response.data, null, 2));
    }
    throw err; // ← RE-THROW SO CALLER KNOWS
  }
};

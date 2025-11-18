// utils/createGameJson.js
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToDrive } from './driveUploader.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createAndUploadGameJson = async (connection, gameId, gameType) => {
  const filename = `${gameType}_${gameId}.json`;
  const tempDir = path.join(__dirname, '..', 'temp');
  const filePath = path.join(tempDir, filename);

  try {
    // === SINGLE QUERY TO FETCH GAME DATA ===
    const [rows] = await connection.query(`
      SELECT
        JSON_OBJECT(
          'gameID', g.game_id,
          'title', g.title,
          'type', gt.name,
          'badge', JSON_OBJECT(
            'title', COALESCE(gb.title, NULL),
            'subtext', COALESCE(gb.subtext, NULL),
            'icon', COALESCE(gb.icon, NULL),
            'color', COALESCE(gb.color, NULL),
            'id', COALESCE(gb.badge_id, NULL)
          ),
          'items', JSON_ARRAYAGG(
            CASE gt.name
              WHEN 'speak' THEN
                JSON_OBJECT('id', gi.item_id, 'sentence', gi.sentence)
              WHEN 'sentence' THEN
                JSON_OBJECT(
                  'id', gi.item_id,
                  'sentence1', gi.sentence1,
                  'sentence2', gi.sentence2,
                  'answer', gi.answer,
                  'definition', gi.definition
                )
              WHEN 'flashcard' THEN
                JSON_OBJECT('id', gi.item_id, 'term', gi.term, 'definition', gi.definition)
              WHEN 'matching' THEN
                JSON_OBJECT('id', gi.item_id, 'term', gi.term, 'definition', gi.definition)
              WHEN 'angleMathHunt' THEN
                JSON_OBJECT(
                  'id', gi.item_id,
                  'question', gi.question,
                  'question_img', gi.question_img,
                  'questionType', gi.questionType,
                  'file', gi.file,
                  'choices', (
                    SELECT JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'id', gc.choice_id,
                        'type', gc.type,
                        'label', gc.label,
                        'file', gc.file,
                        'img', gc.img
                      )
                    )
                    FROM game_choices gc
                    WHERE gc.item_id = gi.item_id
                    ORDER BY gc.choice_id
                  ),
                  'answer', (
                    SELECT gc2.choice_id
                    FROM game_choices gc2
                    WHERE gc2.item_id = gi.item_id AND gc2.is_correct = TRUE
                    LIMIT 1
                  )
                )
              ELSE
                JSON_OBJECT('id', gi.item_id, 'error', CONCAT('Unsupported game type: ', gt.name))
            END
          )
        ) AS game_json
      FROM games g
      JOIN game_types gt ON g.game_type_id = gt.game_type_id
      LEFT JOIN game_badges gb ON g.game_id = gb.game_id
      JOIN game_items gi ON g.game_id = gi.game_id
      WHERE g.game_id = ?
      GROUP BY g.game_id, gt.name, gb.badge_id;
    `, [gameId]);

    if (!rows.length || !rows[0].game_json) {
      throw new Error(`No data found for game_id ${gameId}`);
    }

    const gameData = rows[0].game_json; // Parse if needed (MySQL returns string)

    // === ENSURE TEMP DIRECTORY ===
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // === WRITE JSON FILE ===
    await writeFile(filePath, JSON.stringify(gameData, null, 2), 'utf-8');
    console.log(`JSON file written: ${filePath}`);
    console.log(`[JSON] About to upload to Drive: ${filename}`);

    // === UPLOAD TO GOOGLE DRIVE ===
    let driveMeta;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found after write: ${filePath}`);
    }
    console.log(`[JSON] File exists, size: ${fs.statSync(filePath).size} bytes`);

    try {
      driveMeta = await uploadToDrive({
        path: filePath,
        originalname: filename,
        mimetype: 'application/json'
      });
      console.log(`Drive upload SUCCESS: ${filename} → ${driveMeta.webContentLink}`);
    } catch (uploadErr) {
      console.error(`Drive upload FAILED for ${filename}:`, uploadErr.message);
      throw uploadErr;
    }

    if (!driveMeta?.webContentLink) {
      throw new Error(`Drive upload failed: no webContentLink for ${filename}`);
    }

    // === CLEAN UP TEMP FILE ===
    try {
      await unlink(filePath);
      console.log(`Temp file deleted: ${filePath}`);
    } catch (unlinkErr) {
      console.warn(`Failed to delete temp file: ${filePath}`, unlinkErr);
    }

    return {
      url: driveMeta.webContentLink,
      file_name: filename,
      driveId: driveMeta.id
    };

  } catch (err) {
    console.error(`Failed to create/upload JSON for game ${gameId}:`, err);
    // Cleanup on error
    try { await unlink(filePath); } catch {}
    throw err;
  }
};
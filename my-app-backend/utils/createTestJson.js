// utils/createTestJson.js
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { uploadToDrive } from './driveUploader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '..', 'temp');

export const createAndUploadTestJson = async (connection, testId) => {
  const filename = `quiz_${testId}.json`;
  const filePath = path.join(TEMP_DIR, filename);

  try {
    console.log(`[TEST-JSON] Building quiz JSON for test_id=${testId}`);

    const [rows] = await connection.query(`
      SELECT
        JSON_OBJECT(
          'title', t.test_title,
          'quizId', t.test_id,
          'contentId', t.content_id,
          'description', t.description,
          'settings', JSON_OBJECT(
            'mode', 'open',
            'password', '',
            'allowBack', TRUE,
            'instantFeedback', FALSE,
            'review', TRUE,
            'totalItems', (
              SELECT COUNT(*) FROM test_questions q WHERE q.test_id = t.test_id
            ),
            'maxScore', (
              SELECT SUM(
                CASE
                  WHEN q.question_type = 'truefalse' THEN 1
                  WHEN q.question_type = 'enumeration' THEN (
                    SELECT COUNT(*) FROM question_choices c
                    WHERE c.question_id = q.question_id AND c.is_correct = 1
                  )
                  ELSE (
                    SELECT SUM(c.is_correct) FROM question_choices c
                    WHERE c.question_id = q.question_id
                  )
                END
              ) FROM test_questions q WHERE q.test_id = t.test_id
            ),
            'passingScore', CONCAT(
              ROUND(
                (t.passingScore / (SELECT COUNT(*) FROM test_questions q WHERE q.test_id = t.test_id)) * 100
              ), '%'
            ),
            'shuffleQuestions', TRUE,
            'shuffleChoices', TRUE
          ),
          'questions', (
            SELECT JSON_ARRAYAGG(
              JSON_MERGE_PATCH(
                JSON_OBJECT(
                  'id', q.question_id,
                  'type', q.question_type,
                  'question', q.question_text
                ),
                CASE
                  WHEN q.question_type IN ('enumeration','truefalse') THEN
                    JSON_OBJECT(
                      'answer', (
                        SELECT JSON_ARRAYAGG(c.choice_text)
                        FROM question_choices c
                        WHERE c.question_id = q.question_id AND c.is_correct = 1
                      )
                    )
                  ELSE
                    JSON_OBJECT(
                      'choices', (
                        SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                            'choice_id', c.choice_id,
                            'text', c.choice_text,
                            'points', c.is_correct
                          )
                        )
                        FROM question_choices c
                        WHERE c.question_id = q.question_id
                      )
                    )
                END,
                CASE
                  WHEN q.question_type = 'truefalse' THEN JSON_OBJECT('points', 1)
                  WHEN q.question_type = 'enumeration' THEN JSON_OBJECT(
                    'points', (
                      SELECT COUNT(*) FROM question_choices c
                      WHERE c.question_id = q.question_id AND c.is_correct = 1
                    )
                  )
                  ELSE JSON_OBJECT()
                END
              )
            )
            FROM test_questions q
            WHERE q.test_id = t.test_id
          )
        ) AS quiz_json
      FROM tests t
      WHERE t.test_id = ?
    `, [testId]);

    if (!rows.length || !rows[0].quiz_json) {
      throw new Error(`No quiz data found for test_id ${testId}`);
    }

    // MySQL driver already parsed the JSON column → object
    const quizData = rows[0].quiz_json;

    // -----------------------------------------------------------------
    // 1. Ensure temp folder
    // -----------------------------------------------------------------
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // -----------------------------------------------------------------
    // 2. Write pretty JSON file
    // -----------------------------------------------------------------
    await writeFile(filePath, JSON.stringify(quizData, null, 2), 'utf8');
    console.log(`[TEST-JSON] File written: ${filePath}`);

    // -----------------------------------------------------------------
    // 3. Upload to Google Drive
    // -----------------------------------------------------------------
    console.log(`[TEST-JSON] Uploading ${filename} to Drive…`);
    const driveMeta = await uploadToDrive({
      path: filePath,
      originalname: filename,
      mimetype: 'application/json',
    });
    console.log(`[TEST-JSON] Uploaded → ${driveMeta.webContentLink}`);

    // -----------------------------------------------------------------
    // 4. Clean up local file
    // -----------------------------------------------------------------
    try {
      await unlink(filePath);
      console.log(`[TEST-JSON] Temp file removed`);
    } catch (e) {
      console.warn(`[TEST-JSON] Could not delete temp file:`, e.message);
    }

    // -----------------------------------------------------------------
    // 5. Return what the controller needs
    // -----------------------------------------------------------------
    return {
      url: driveMeta.webContentLink,
      file_name: filename,
      driveId: driveMeta.id,
    };
  } catch (err) {
    console.error(`[TEST-JSON] FAILED for test_id=${testId}:`, err);
    // Try to delete the half-written file
    try { await unlink(filePath); } catch {}
    throw err;   // caller will rollback the transaction
  }
};
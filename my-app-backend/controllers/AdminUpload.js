// my-app-backend/controllers/AdminUpload.js
import pool from '../services/db.js';
import { uploadToDrive } from '../utils/driveUploader.js';
import { createAndUploadGameJson } from '../utils/createGameJson.js';
import { createAndUploadTestJson } from '../utils/createTestJson.js';

export const uploadLesson = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { userId } = req.user;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });

    // 🔹 Extract uploaded files from Multer (explicit keys used by frontend)
    const fileInput = req.files?.['fileInput']?.[0] || null;
    const videoInput = req.files?.['videoInput']?.[0] || null;
    const imageQuizFiles = req.files?.['imagequiz_images[]'] || [];

    // 🔹 Upload them to Google Drive (main attachments)
    let driveFile = null;
    let driveVideo = null;

    if (fileInput) {
      driveFile = await uploadToDrive(fileInput);
      console.log('📁 Uploaded file to Drive:', {
        name: driveFile?.name,
        mimeType: fileInput.mimetype,
        link: driveFile?.webContentLink,
      });
    }

    if (videoInput) {
      driveVideo = await uploadToDrive(videoInput);
      console.log('🎞️ Uploaded video to Drive:', {
        name: driveVideo?.name,
        mimeType: videoInput.mimetype,
        link: driveVideo?.webContentLink,
      });
    }

    console.log('📸 Uploaded imageQuizFiles:', imageQuizFiles.map(f => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    })));

    console.log('📦 Multer files received:');
    if (req.files) {
      for (const [field, files] of Object.entries(req.files)) {
        console.log(`🗂️ Field: ${field}`);
        files.forEach((f, i) => {
          console.log(`   [${i}] originalname="${f.originalname}", mimetype="${f.mimetype}", size=${f.size}`);
        });
      }
    } else {
      console.log('🚫 No files received at all.');
    }



    // 🔹 Extract form fields
    const {
      lesson_title,
      lesson_description,
      selected_quarter,
      selected_subject,
      pretest_questions = [],
      posttest_questions = [],
      games = {},
      badges: badgesRaw,
      status,
      videoUrl,
      videoUrlTitle,
      videoUrlSubtitle,
      fileTitle,
      fileSubtitle,
      videoTitle,
      videoSubtitle
    } = req.body;

    // 🔹 Parse JSON strings if necessary
    const pretestQuestions = typeof pretest_questions === 'string' ? JSON.parse(pretest_questions) : pretest_questions;
    const posttestQuestions = typeof posttest_questions === 'string' ? JSON.parse(posttest_questions) : posttest_questions;
    const gamesContents = typeof games === 'string' ? JSON.parse(games) : games; // final games object from frontend
    const badges = badgesRaw ? JSON.parse(badgesRaw) : {};

    // 🔹 Normalize subject + quarter
    const subjectName = selected_subject === 'Math' ? 'Mathematics' : selected_subject;
    const quarterMap = { quarter1: 1, quarter2: 2, quarter3: 3, quarter4: 4 };
    const quarter = quarterMap[selected_quarter?.toLowerCase?.()] || 1;

    const [subjectRows] = await connection.query(`SELECT subject_id FROM subjects WHERE subject_name = ?`, [subjectName]);
    if (!subjectRows.length) throw new Error(`Subject "${subjectName}" not found`);
    const subjectId = subjectRows[0].subject_id;

    const lessonStatus = status === 'published';

    // 🧩 Debug log
    console.log('📥 Extracted form data:\n' + JSON.stringify({
      lesson_title,
      lesson_description,
      games: gamesContents,
      badges,
      quarter,
      subjectId,
      fileTitle,
      fileSubtitle,
      videoTitle,
      videoSubtitle,
      videoUrl,
      videoUrlTitle,
      videoUrlSubtitle,
      hasFile: !!fileInput,
      hasVideo: !!videoInput
    }, null, 2));

    // 🧩 Debug: log imagequiz and its choices
    if (gamesContents.imagequiz && gamesContents.imagequiz.length > 0) {
      console.log('🧠 Debug — imagequiz items received:');
      gamesContents.imagequiz.forEach((item, i) => {
        console.log(`  ▶ Item ${i}: question="${item.question}" image="${item.image}"`);
        if (Array.isArray(item.choices)) {
          item.choices.forEach((ch, j) => {
            console.log(`     • Choice ${j}:`, ch);
          });
        } else {
          console.log(`     ⚠️ No choices found for item ${i}`);
        }
      });
    } else {
      console.log('🚫 No imagequiz data found in gamesContents.');
    }


    // Step 1: Get the next lesson_number for this subject
    const [maxResult] = await connection.query(
      `SELECT COALESCE(MAX(lesson_number), 0) AS max_number 
       FROM lessons 
       WHERE subject_belong = ?`,
      [subjectId]
    );
    const nextLessonNumber = maxResult[0].max_number + 1;

    // Step 2: Insert Lesson record
    const [lessonResult] = await connection.query(
      `INSERT INTO lessons (lesson_title, description, subject_belong, quarter, lesson_number, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lesson_title, lesson_description, subjectId, quarter, nextLessonNumber, lessonStatus]
    );
    const lessonId = lessonResult.insertId;

    // 🔹 Insert uploaded files (Drive + URL) into subject_contents
    const uploadsToInsert = [];

    const addUpload = (meta, typeHint, title, subtitle) => {
      if (!meta) return;
      let contentType = 'other';
      const mime = meta.mimeType || '';

      if (mime.includes('pdf')) contentType = 'pdf';
      else if (mime.includes('presentation') || mime.includes('ms-powerpoint')) contentType = 'ppt';
      else if (mime.includes('video') || mime.includes('mp4')) contentType = 'video';
      else if (typeHint) contentType = typeHint;

      uploadsToInsert.push([
        lessonId,
        contentType,
        meta.webContentLink,
        title || meta.name,
        subtitle || null,
        meta.name
      ]);
    };

    addUpload(driveFile, 'ppt', fileTitle, fileSubtitle);
    addUpload(driveVideo, 'video', videoTitle, videoSubtitle);

    if (videoUrl) {
      uploadsToInsert.push([
        lessonId,
        'url',
        videoUrl,
        videoUrlTitle || 'Video Link',
        videoUrlSubtitle || '',
        null
      ]);
    }

    for (const uploadRow of uploadsToInsert) {
      await connection.query(
        `INSERT INTO subject_contents (lesson_belong, content_type, url, title, description, file_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        uploadRow
      );
    }

    // 🔹 Game mappings
    const gameTypeMap = {
      matching: 'game_match',
      flashcard: 'game_flash',
      speak: 'game_speak',
      spelling: 'game_comp',
      imagequiz: 'game_img'
    };

    const gameMetaMap = {
      matching: {
        title: 'Match It Up!',
        description: 'Pair related items to test your memory and sharpen your connections.'
      },
      flashcard: {
        title: 'Flash Recall!',
        description: 'Flip through fast-paced flashcards to boost your brainpower and recall speed.'
      },
      speak: {
        title: 'Speak Out Loud!',
        description: 'Practice pronunciation and express yourself with confidence in this speaking challenge.'
      },
      spelling: {
        title: 'Spell in the blank!',
        description: 'Complete the missing word by spelling it correctly to finish the sentence.'
      },
      imagequiz: {
        title: 'Picture Quiz!',
        description: 'Look closely and choose the right answer based on visual clues and fun images.'
      }
    };

    // 🔹 Upload imagequiz images to Google Drive
    if (imageQuizFiles.length > 0) {
      let imageFileIndex = 0;

      // Upload every file in order and map back using placeholders
      for (const [itemIndex, item] of (gamesContents.imagequiz || []).entries()) {
        // 1. Question Image
        if (item.image && typeof item.image === 'string' && item.image.startsWith('imagequiz_images[')) {
          const uploadedFile = imageQuizFiles[imageFileIndex++];
          
          if (uploadedFile) {
            const localPath = uploadedFile.path;

            const driveMeta = await uploadToDrive(uploadedFile);
            item.question_img = driveMeta.webContentLink;
            item.file = driveMeta.name;

            console.log(`Uploaded question image for item ${itemIndex}:`, driveMeta.name);

            // 🗑️ INLINE DELETE
            fs.unlink(localPath, (err) => {
              if (err) console.error("❌ Failed to delete local file:", localPath, err);
              else console.log("🗑️ Deleted local file:", localPath);
            });
          }
        }

        // 2. Choice Images
        for (let c = 0; c < item.choices.length; c++) {
          const choice = item.choices[c];

          if (typeof choice === 'string' && choice.startsWith('imagequiz_images[')) {
            const uploadedFile = imageQuizFiles[imageFileIndex++];
            if (uploadedFile) {
              const driveMeta = await uploadToDrive(uploadedFile);
              item.choices[c] = {
                img: driveMeta.webContentLink,
                file: driveMeta.name,
                type: 'image'
              };
              console.log(`Uploaded choice ${c} for item ${itemIndex}:`, driveMeta.name);

              // 🗑️ INLINE DELETE
              fs.unlink(localPath, (err) => {
                if (err) console.error("❌ Failed to delete local file:", localPath, err);
                else console.log("🗑️ Deleted local file:", localPath);
              });
            }
          } else if (typeof choice === 'string' && choice.trim()) {
            // Keep plain text choices
            item.choices[c] = {
              label: choice,
              type: 'text'
            };
          }
        }
      }
    }

    // COLLECT GAMES TO PROCESS LATER
    const gamesToProcess = []; // { gameId, gameType, contentId }
    let gameId;

    // 🔹 Insert Games and Game Items
    for (const [gameType, items] of Object.entries(gamesContents || {})) {
      if (!Array.isArray(items) || items.length <= 1) {
        console.log(`Skipping ${gameType} (less than 2 items)`);
        continue;
      }

      const normalizedGameType = gameTypeMap[gameType];

      if (!normalizedGameType) {
        console.warn(`Unknown game type from frontend: ${gameType}`);
        continue;
      }


      const [typeRow] = await connection.query(
        `SELECT game_type_id FROM game_types WHERE name = ? LIMIT 1`,
        [normalizedGameType]
      );

      if (!typeRow.length) {
        console.warn(`Skipping game "${gameType}" - game_type_id not found`);
        continue;
      }
      const gameTypeId = typeRow[0].game_type_id;

      const { title, description } = gameMetaMap[gameType];

      // Insert subject_contents (temp, will update url later)
      const [gameContentResult] = await connection.query(
        `INSERT INTO subject_contents (lesson_belong, content_type, title, description)
         VALUES (?, ?, ?, ?)`,
        [lessonId, gameTypeMap[gameType], title, description]
      );
      const contentId = gameContentResult.insertId;

      // Insert games record
      const [gameResult] = await connection.query(
        `INSERT INTO games (subject_id, content_id, game_type_id, title, description, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          subjectId,
          contentId,
          gameTypeId,
          gameTypeMap[gameType],
          `Auto-created game for ${gameType}`,
          userId
        ]
      );
      const gameId = gameResult.insertId;

      // Insert badge
      const badge = badges[gameType];
      if (badge) {
        const { title, subtitle: subtext, icon, bg: color } = badge;
        await connection.query(
          `INSERT INTO game_badges (game_id, title, color, icon, subtext)
           VALUES (?, ?, ?, ?, ?)`,
          [gameId, title, color, icon, subtext]
        );
      }

      // Insert game items + choices
      for (const item of items) {
        let term = null, definition = null, sentence1 = null, sentence2 = null, answer = null, sentence = null;
        let question = null, question_img = null, questionType = 'text';

        if (gameType === 'matching') {
          term = item.term || null;
          definition = item.definition || null;
        } else if (gameType === 'flashcard') {
          term = item.front || null;
          definition = item.back || null;
        } else if (gameType === 'spelling') {
          sentence1 = item.first || null;
          sentence2 = item.last || null;
          answer = item.answer || null;
          definition = item.definition || null;
        } else if (gameType === 'speak') {
          sentence = item.prompt || null;
        } else if (gameType === 'imagequiz') {
          question = item.question || null;
          question_img = item.question_img || null;
          item.file = item.file || null;
          questionType = question && question_img ? 'both' : question_img ? 'image' : 'text';
        }

        const [gameItemResult] = await connection.query(
          `INSERT INTO game_items (game_id, term, definition, sentence1, sentence2, answer, sentence, question, question_img, questionType, file)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            gameId, term, definition, sentence1, sentence2, answer, sentence,
            question || null, question_img || null, questionType, item.file || null
          ]
        );
        const itemId = gameItemResult.insertId;

        // Insert choices
        if (item.choices?.length) {
          const letterToIndex = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
          const correctIndex = letterToIndex[(item.correct || '').trim().toLowerCase()] ?? null;

          for (let i = 0; i < item.choices.length; i++) {
            const choice = item.choices[i];
            let label = null, file = null, img = null, type = 'text', is_correct = false;

            is_correct = (i === correctIndex);

            if (typeof choice === 'string') {
              if (!choice.trim()) continue;
              if (choice.startsWith('imagequiz_images[') || choice.startsWith('C:\\fakepath\\')) {
                type = 'image'; file = choice;
              } else {
                label = choice; type = 'text';
              }
            } else if (typeof choice === 'object') {
              label = choice.label || null;
              file = choice.file || null;
              img = choice.img || null;
              type = choice.type || 'text';
            }

            await connection.query(
              `INSERT INTO game_choices (item_id, type, label, file, img, is_correct)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [itemId, type, label, file, img, is_correct ? 1 : 0]
            );
          }
        }
      }

      // COLLECT FOR LATER
      gamesToProcess.push({ gameId, gameType, contentId });
    }

    // AFTER ALL GAMES ARE INSERTED → GENERATE JSONS
    for (const { gameId, gameType, contentId } of gamesToProcess) {
      try {
        const { url: jsonUrl, file_name: jsonFileName } = await createAndUploadGameJson(
          connection,
          gameId,
          gameType
        );

        await connection.query(
          `UPDATE subject_contents SET url = ?, file_name = ? WHERE content_id = ?`,
          [jsonUrl, jsonFileName, contentId]
        );

        console.log(`Game JSON uploaded: ${jsonFileName} → ${jsonUrl}`);
      } catch (jsonErr) {
        console.error(`Failed to generate JSON for game ${gameId}:`, jsonErr);
        // Don't fail lesson
      }
    }

    // 🔹 Insert Quizzes (unchanged)
    const insertQuiz = async (questions, label) => {
      if (!Array.isArray(questions) || questions.length === 0) return;

      const title = `Lesson ${lesson_title} ${label}`;

      // 1. subject_contents row (type = quiz)
      const [contentResult] = await connection.query(
        `INSERT INTO subject_contents (lesson_belong, content_type, title, description)
         VALUES (?, 'quiz', ?, ?)`,
        [lessonId, title, JSON.stringify(questions)]
      );
      const contentId = contentResult.insertId;

      // 2. tests row
      const totalItems = questions.length;
      const passingScore = Math.ceil(totalItems * 0.5);
      const [testResult] = await connection.query(
        `INSERT INTO tests (content_id, created_by, test_title, passingScore, totalItems, shuffleQuestions, shuffleChoices, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [contentId, userId, `${label} for ${lesson_title}`, passingScore, totalItems, false, false, 'Auto-generated quiz']
      );
      const testId = testResult.insertId;

      // 3. test_questions + choices
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionText = q.questionText || q.question_text || null;
        if (!questionText) continue;

        const typeMap = { fillblank: 'enumeration', multiple: 'multichoice', truefalse: 'truefalse' };
        const questionType = typeMap[q.type] || 'multichoice';

        const [qRes] = await connection.query(
          `INSERT INTO test_questions (test_id, item_no, question_text, question_type, item_value)
           VALUES (?, ?, ?, ?, ?)`,
          [testId, i + 1, questionText, questionType, 1]
        );
        const questionId = qRes.insertId;

        // ----- true/false ----------------------------------------------------
        if (questionType === 'truefalse') {
          for (const opt of ['True', 'False']) {
            const isCorrect = q.correctAnswer?.toLowerCase() === opt.toLowerCase();
            await connection.query(
              `INSERT INTO question_choices (question_id, choice_text, is_correct)
               VALUES (?, ?, ?)`,
              [questionId, opt, isCorrect]
            );
          }
        // ----- multiple choice -----------------------------------------------
        } else if (questionType === 'multichoice') {
          const correctIndex = q.correctAnswer?.toUpperCase()?.charCodeAt(0) - 65;
          for (let j = 0; j < q.options.length; j++) {
            const isCorrect = j === correctIndex;
            await connection.query(
              `INSERT INTO question_choices (question_id, choice_text, is_correct)
               VALUES (?, ?, ?)`,
              [questionId, q.options[j], isCorrect]
            );
          }
        // ----- enumeration ---------------------------------------------------
        } else if (questionType === 'enumeration') {
          if (q.correctAnswer) {
            await connection.query(
              `INSERT INTO question_choices (question_id, choice_text, is_correct)
               VALUES (?, ?, ?)`,
              [questionId, q.correctAnswer, true]
            );
          }
        }
      }

      // --------------------------------------------------------------
      // 4. **Generate & upload the quiz JSON** (side-by-side with games)
      // --------------------------------------------------------------
      try {
        const { url: quizUrl, file_name: quizFile } = await createAndUploadTestJson(
          connection,
          testId
        );

        await connection.query(
          `UPDATE subject_contents SET url = ?, file_name = ? WHERE content_id = ?`,
          [quizUrl, quizFile, contentId]
        );

        console.log(`Quiz JSON uploaded: ${quizFile} → ${quizUrl}`);
      } catch (jsonErr) {
        console.error(`Failed to generate quiz JSON for test_id=${testId}:`, jsonErr);
        // **Do NOT rollback** – the quiz works in the DB, JSON is just a cache
      }

    };

    await insertQuiz(pretestQuestions, 'Pretest');
    await insertQuiz(posttestQuestions, 'Posttest');

    await connection.commit();
    return res.json({ success: true, message: '✅ Lesson uploaded successfully with all contents' });
  } catch (err) {
    console.error('💥 Error uploading lesson:', err);
    await connection.rollback();
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    connection.release();
  }
};

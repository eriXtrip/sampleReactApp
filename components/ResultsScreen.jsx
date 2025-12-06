// SAMPLEREACTAPP/components/ResultScreen.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import Spacer from "./Spacer";
import SummaryBox from './SummaryBox';
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { usePreventScreenCapture } from "expo-screen-capture";
import Star from './Star';

const ResultScreen = ({ score, quizData, answers, onClose, startedAt, isPracticeMode, onShowStar }) => {
  console.log("ResultScreen Props:", { score, quizData, answers, startedAt, isPracticeMode });
  const db = useSQLiteContext();
  const [completedAt, setCompletedAt] = useState(new Date());
  
  // Debug: Log the dates
  console.log("📅 Started At (from props):", startedAt, "Type:", typeof startedAt);
  console.log("📅 Completed At (state):", completedAt, "Type:", typeof completedAt);

  const [showStar, setShowStar] = useState(false);
  const starComponentRef = useRef(null);

  //usePreventScreenCapture();

  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);

  const passingPercent = parseInt(quizData.settings.passingScore.replace("%", ""), 10);
  const percentageScore = (score / quizData.settings.maxScore) * 100;
  const passed = percentageScore >= passingPercent;

  // ✅ FIXED: Proper duration calculation
  const calculateDuration = () => {
    try {
      // Convert strings to Date objects
      const startDate = new Date(startedAt);
      const endDate = new Date(completedAt);
      
      console.log("⏱️ Start Date:", startDate);
      console.log("⏱️ End Date:", endDate);
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log("Invalid date format");
        return "0m 0s";
      }
      
      // Calculate difference in milliseconds
      const durationMs = Math.abs(endDate.getTime() - startDate.getTime());
      console.log("⏱️ Duration in ms:", durationMs);
      
      const durationMins = Math.floor(durationMs / 60000);
      const durationSecs = Math.floor((durationMs % 60000) / 1000);
      
      return `${durationMins}m ${durationSecs}s`;
    } catch (error) {
      console.log("Error calculating duration:", error);
      return "0m 0s";
    }
  };

  const duration = calculateDuration();

  let correctItems = 0;

  // 🔹 get single saved user from users table
  const getCurrentUserId = async () => {
    const result = await db.getFirstAsync(`SELECT user_id FROM users LIMIT 1`);
    return result?.user_id || null;
  };

  const getCurrentFlags = () => ({
    isOffline,
    isReachable,
    isApiLoaded,
  });

  const saveResults = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const now = completedAt.toISOString();

    try {
      // ----------------------------------------
      // 1. Get next attempt number
      // ----------------------------------------
      const rows = await db.getAllAsync(
        `SELECT MAX(attempt_number) AS max_attempt
        FROM pupil_test_scores
        WHERE pupil_id = ? AND test_id = ?`,
        [userId, quizData.quizId]
      );

      const maxAttempt = rows[0]?.max_attempt;
      const nextAttempt = maxAttempt ? maxAttempt + 1 : 1;

      // ----------------------------------------
      // 2. Insert new test score
      // ----------------------------------------
      const grade = Math.round((score / quizData.settings.maxScore) * 100);

      await db.runAsync(
        `INSERT INTO pupil_test_scores 
        (pupil_id, test_id, score, max_score, taken_at, grade, attempt_number, is_synced, server_score_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)`,
        [
          userId,
          quizData.quizId,
          score,
          quizData.settings.maxScore,
          now,
          grade,
          nextAttempt
        ]
      );

      // ⭐ ----------------------------------------
      // ⭐ REWARD LOGIC (Grade 100 + Attempt 1)
      // ⭐ ----------------------------------------
      if (grade === 100) {

        setShowStar(true);
        setTimeout(() => {
          starComponentRef.current?.play();
        }, 100);

        try {
          await db.runAsync(
            `UPDATE users 
            SET pupil_points = pupil_points + 1 
            WHERE user_id = ?`,
            [userId]
          );
          console.log("⭐ Reward applied! +1 pupil_point");
        } catch (err) {
          console.log("❌ Failed to update pupil_points:", err);
        }
        
        onShowStar?.();
      }

      // ----------------------------------------
      // 3. Update content and lesson status (your existing code)
      // ----------------------------------------
      if (passed) {
        await db.runAsync(
          `UPDATE subject_contents 
          SET done = 1, completed_at = ?, started_at = ?, duration = ?
          WHERE server_content_id = ?`,
          [now, startedAt, duration, quizData.contentId]
        );

        const contentRow = await db.getAllAsync(
          `SELECT lesson_belong 
          FROM subject_contents 
          WHERE server_content_id = ?`,
          [quizData.contentId]
        );

        if (contentRow && contentRow.length > 0) {
          const lesson_belong = contentRow[0].lesson_belong;

          const rows = await db.getAllAsync(
            `SELECT done FROM subject_contents WHERE lesson_belong = ?`,
            [lesson_belong]
          );

          const total = rows.length;
          const doneCount = rows.filter(r => r.done).length;
          const progress = total > 0 ? (doneCount / total) * 100 : 0;

          const lessonStatus = progress === 100;
          const lessonCompletedAt = lessonStatus ? now : null;

          await db.runAsync(
            `UPDATE lessons
            SET status = ?, progress = ?, last_accessed = ?, completed_at = ?
            WHERE lesson_id = ?`,
            [lessonStatus ? 1 : 0, progress, now, lessonCompletedAt, lesson_belong]
          );

          console.log(`📘 Lesson ${lesson_belong} updated: progress=${progress}, status=${lessonStatus}`);
        }
      } else {
        console.log(`Content ${quizData.quizId} not marked done — quiz not passed.`);
      }

      // ✅ Save answers
      for (const q of quizData.questions) {
        const userAns = answers[q.id];

        // function to map answer text → choice_id
        const findChoiceId = (question, answerText) => {
          if (!question.choices) return null;
          const item = question.choices.find(c => c.text === answerText);
          return item ? item.choice_id : null;
        };

        // MULTIPLE CHOICE & TRUE/FALSE
        if (q.type === "multichoice" || q.type === "truefalse") {
          const choiceId = findChoiceId(q, userAns);

          await db.runAsync(
            `INSERT INTO pupil_answers 
            (pupil_id, question_id, choice_id, is_synced, server_answer_id)
            VALUES (?, ?, ?, 0, NULL)`,
            [userId, q.id, choiceId]
          );
        }

        // ENUMERATION (no choice_id, only answer_text)
        else if (q.type === "enumeration") {
          await db.runAsync(
            `INSERT INTO pupil_answers 
            (pupil_id, question_id, choice_id, is_synced, server_answer_id)
            VALUES (?, ?, NULL, 0, NULL)`,
            [userId, q.id]
          );
        }

        // MULTISELECT
        else if (q.type === "multiselect") {
          const arr = userAns || [];

          for (const ansText of arr) {
            const choiceId = findChoiceId(q, ansText);

            await db.runAsync(
              `INSERT INTO pupil_answers 
              (pupil_id, question_id, choice_id, is_synced, server_answer_id)
              VALUES (?, ?, ?, 0, NULL)`,
              [userId, q.id, choiceId]
            );
          }
        }
      }

      console.log("✅ Results saved for user:", userId);

    } catch (err) {
      console.log("❌ Error saving results:", err);
    }
  };

  // 🔹 save when ResultScreen mounts
  useEffect(() => {
    if(!isPracticeMode){
      saveResults();
    }
  }, []);

  const renderReviewItem = ({ item }) => {
    let userAns = answers[item.id];
    let acquiredPoints = 0;

    if (item.type === "multichoice") {
      const chosen = item.choices.find((c) => c.text === userAns);
      acquiredPoints = chosen ? chosen.points : 0;
    } else if (item.type === "truefalse") {
      const correctAnswer = Array.isArray(item.answer) ? item.answer[0] : item.answer;
      if (answers[item.id] === correctAnswer) {
        acquiredPoints = item.points;
      }
    } else if (item.type === "enumeration") {
      const userAnsArray = (answers[item.id] || "")
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a !== "");
      const correctAnswers = item.answer.map((a) => a.toLowerCase());
      let correctCount = 0;
      userAnsArray.forEach((ans) => {
        if (correctAnswers.includes(ans)) correctCount++;
      });
      // award proportional points
      acquiredPoints = correctCount > 0 ? item.points : 0;
    } else if (item.type === "multiselect") {
      const userAnsArray = answers[item.id] || [];
      item.choices.forEach((c) => {
        if (userAnsArray.includes(c.text)) acquiredPoints += c.points;
      });
    }

    // ✅ count item as correct if user got any points
    if (acquiredPoints > 0) correctItems++;

    return (
      <View style={styles.reviewCard}>
        <Text style={styles.reviewQuestion}>{item.question}</Text>
        <Text style={styles.reviewLabel}>
          Your Answer: <Text style={styles.reviewUser}>{userAns || "No answer"}</Text>
        </Text>
        <Text style={styles.reviewLabel}>
          Points Acquired: <Text style={styles.reviewCorrect}>{acquiredPoints}</Text>
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isPracticeMode ? "Review Result" : "Test Results"}</Text>

      {showStar && (
        <Star 
          ref={starComponentRef}
          onClose={() => setShowStar(false)}
        />
      )}

      {/* Summary Info */}
      <SummaryBox passed={passed} score={score} maxScore={quizData.settings.maxScore}>
        <Text style={{ marginTop: 8 }}>Started: {new Date(startedAt).toLocaleString()}</Text>
        <Text>Completed: {new Date(completedAt).toLocaleString()}</Text>
        <Text>Duration: {duration}</Text>
        <Text style={{ marginTop: 6 }}>Grade: {score} out of {quizData.settings.maxScore} ({Math.round((score / quizData.settings.maxScore) * 100)}%)</Text>
      </SummaryBox>

      {quizData.settings.review && (
        <FlatList
          data={quizData.questions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderReviewItem}
        />
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
  summaryBox: {
    backgroundColor: "#eef",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  closeButton: { marginTop: 20, backgroundColor: "#333", padding: 15, borderRadius: 8 },
  closeText: { color: "#fff", textAlign: "center" },
  reviewCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 8,
  },
  reviewQuestion: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  reviewLabel: { fontSize: 14, marginBottom: 4 },
  reviewUser: { color: "orange", fontWeight: "600" },
  reviewCorrect: { color: "green", fontWeight: "600" },
});

export default ResultScreen;
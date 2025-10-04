// components/ResultScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import Spacer from "./Spacer";

const ResultScreen = ({ score, quizData, answers, onClose, startedAt }) => {
  console.log("ResultScreen Props:", { score, quizData, answers, startedAt });
  const db = useSQLiteContext();
  const [completedAt, setCompletedAt] = useState(new Date());

  const passingPercent = parseInt(quizData.settings.passingScore.replace("%", ""), 10);
  const percentageScore = (score / quizData.settings.maxScore) * 100;
  const passed = percentageScore >= passingPercent;

  const durationMs = new Date(completedAt) - new Date(startedAt);
  const durationMins = Math.floor(durationMs / 60000);
  const durationSecs = Math.floor((durationMs % 60000) / 1000);

  let correctItems = 0;

  // 🔹 get single saved user from users table
  const getCurrentUserId = async () => {
    const result = await db.getFirstAsync(`SELECT user_id FROM users LIMIT 1`);
    return result?.user_id || null;
  };

  const saveResults = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const now = completedAt.toISOString();
    try {
      // ✅ Save score
      await db.runAsync(
        `INSERT INTO pupil_test_scores (pupil_id, test_id, score, max_score, taken_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, quizData.quizId, score, quizData.settings.maxScore, now]
      );

      // ✅ Save answers
      for (const q of quizData.questions) {
        const userAns = answers[q.id];

        if (q.type === "multichoice" || q.type === "truefalse") {
          await db.runAsync(
            `INSERT INTO pupil_answers (pupil_id, question_id, choice_id) VALUES (?, ?, ?)` ,
            [userId, q.id, userAns ?? null]
          );
        } else if (q.type === "enumeration") {
          await db.runAsync(
            `INSERT INTO pupil_answers (pupil_id, question_id, choice_id) VALUES (?, ?, ?)` ,
            [userId, q.id, JSON.stringify(userAns)]
          );
        } else if (q.type === "multiselect") {
          for (const choice of userAns || []) {
            await db.runAsync(
              `INSERT INTO pupil_answers (pupil_id, question_id, choice_id) VALUES (?, ?, ?)` ,
              [userId, q.id, choice]
            );
          }
        }
      }

      console.log("✅ Results saved for user:", userId);
    } catch (err) {
      console.error("❌ Error saving results:", err);
    }
  };

  // 🔹 save when ResultScreen mounts
  useEffect(() => {
    saveResults();
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
      <Text style={styles.title}>Quiz Results</Text>

      {/* Summary Info */}
      <View style={styles.summaryBox}>
        <Text>Status: {passed ? "Passed" : "Failed"}</Text>
        <Text>Started: {new Date(startedAt).toLocaleString()}</Text>
        <Text>Completed: {new Date(completedAt).toLocaleString()}</Text>
        <Text>
          Duration: {durationMins}m {durationSecs}s
        </Text>
        <Text>Points: {score} / {quizData.settings.maxScore}</Text>
        <Text>
          Grade: {score} out of {quizData.settings.maxScore} (
          {Math.round((score / quizData.settings.maxScore) * 100)}%)
        </Text>
      </View>

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

      <Spacer height={40} />
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

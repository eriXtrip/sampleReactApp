// components/ResultScreen.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import Spacer from "./Spacer";

const ResultScreen = ({ score, quizData, answers, onClose }) => {
  const passed = score >= quizData.settings.passingScore;

  const renderReviewItem = ({ item }) => {
    let userAns = answers[item.id];
    let correctAns = "";

    if (item.type === "multichoice") {
      const correctChoice = item.choices.find((c) => c.points > 0);
      correctAns = correctChoice ? correctChoice.text : "";
    } else if (item.type === "truefalse") {
      correctAns = item.answer ? "True" : "False";
    } else if (item.type === "enumeration") {
      correctAns = item.answer.join(", ");
    } else if (item.type === "multiselect") {
      correctAns = item.choices
        .filter((c) => c.points > 0)
        .map((c) => c.text)
        .join(", ");
      userAns = (userAns || []).join(", ");
    }

    return (
      <View style={styles.reviewCard}>
        <Text style={styles.reviewQuestion}>{item.question}</Text>
        <Text style={styles.reviewLabel}>
          Your Answer: <Text style={styles.reviewUser}>{userAns || "No answer"}</Text>
        </Text>
        <Text style={styles.reviewLabel}>
          Correct Answer: <Text style={styles.reviewCorrect}>{correctAns}</Text>
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz Finished!</Text>
      <Text style={styles.resultText}>
        Total Score: {score} / {quizData.settings.totalItems}
      </Text>

      {passed ? (
        <Text style={styles.passText}>🎉 Congratulations! You passed!</Text>
      ) : (
        <Text style={styles.failText}>
          😢 Aww don’t be sad, there’s always room for improvement!
        </Text>
      )}

      {/* Review Section if enabled */}
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
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  resultText: { fontSize: 18, textAlign: "center", marginBottom: 10 },
  passText: { color: "green", fontSize: 18, textAlign: "center", marginBottom: 10 },
  failText: { color: "red", fontSize: 18, textAlign: "center", marginBottom: 10 },
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
  reviewUser: { color: "red", fontWeight: "600" },
  reviewCorrect: { color: "green", fontWeight: "600" },
});

export default ResultScreen;

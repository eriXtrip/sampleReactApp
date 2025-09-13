// components/QuestionCard.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const QuestionCard = ({ question }) => {
  return (
    <View style={styles.questionCard}>
      <Text style={styles.questionText}>
        {question}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  questionCard: {
    backgroundColor: "#ddf6fc1f",
    height: 150,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#92cbd6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  questionText: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
});

export default QuestionCard;

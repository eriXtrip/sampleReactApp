// components/FeedbackMessage.jsx
import React from "react";
import { Text, StyleSheet } from "react-native";
import lessonData from "../data/lessonData";

const { feedbackMessages } = lessonData;

function getRandomFeedback(type, result) {
  const messages = feedbackMessages[type][result];
  return messages[Math.floor(Math.random() * messages.length)];
}

const FeedbackMessage = ({ type, result, color, style }) => {
  if (!type || !result) return null;

  const text = getRandomFeedback(type, result);

  return <Text style={[styles.feedbackText, { color }, style]}>{text}</Text>;
};

const styles = StyleSheet.create({
  feedbackText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
});

export default FeedbackMessage;

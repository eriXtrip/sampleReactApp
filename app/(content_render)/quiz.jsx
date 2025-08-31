import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, Alert, TextInput, StyleSheet, Modal, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";

export default function QuizScreen() {
  const { quizUri } = useLocalSearchParams(); 
  const router = useRouter();
  const navigation = useNavigation();

  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);

  const theme = {
    cardBorder: "#ccc",
    text: "#333",
    background: "#fff",
  };

  const screenWidth = Dimensions.get("window").width;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Load JSON file
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const jsonString = await FileSystem.readAsStringAsync(quizUri);
        const parsed = JSON.parse(jsonString);
        setQuizData(parsed);
      } catch (err) {
        console.error("Failed to load quiz JSON:", err);
        Alert.alert("Error", "Unable to load quiz file.");
      }
    };
    loadQuiz();
  }, [quizUri]);

  if (!quizData) {
    return (
      <View style={styles.container}>
        <Text>Loading quiz...</Text>
      </View>
    );
  }

  const question = quizData.questions[currentQuestion];

  // Selection handlers
  const handleSelectChoice = (choice) => {
    setAnswers({ ...answers, [question.id]: choice });
  };

  const handleToggleMultiSelect = (choice) => {
    const current = answers[question.id] || [];
    if (current.includes(choice)) {
      setAnswers({ ...answers, [question.id]: current.filter((c) => c !== choice) });
    } else {
      setAnswers({ ...answers, [question.id]: [...current, choice] });
    }
  };

  const handleEnumeration = (text) => {
    setAnswers({ ...answers, [question.id]: text });
  };

  const handleNext = () => {
    if (currentQuestion + 1 < quizData.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let total = 0;
      quizData.questions.forEach((q) => {
        if (q.type === "multichoice") {
          const userAns = answers[q.id];
          const correct = q.choices.find((c) => c.text === userAns && c.points > 0);
          if (correct) total += correct.points;
        } else if (q.type === "enumeration") {
            const userAnsArray = (answers[q.id] || "")
                .split(",")                     // allow "red, blue, yellow"
                .map((a) => a.trim().toLowerCase())
                .filter((a) => a !== "");        // remove empty values

            const correctAnswers = q.answer.map((a) => a.toLowerCase());

            // Count matches
            let correctCount = 0;
            userAnsArray.forEach((ans) => {
                if (correctAnswers.includes(ans)) correctCount++;
            });

            // Award partial points or full points
            if (correctCount > 0) {
                total += (q.points / correctAnswers.length) * correctCount;
            }
        } else if (q.type === "truefalse") {
          if (answers[q.id] === q.answer) total += q.points;
        } else if (q.type === "multiselect") {
          const userAns = answers[q.id] || [];
          q.choices.forEach((c) => {
            if (userAns.includes(c.text)) total += c.points;
          });
        }
      });
      setScore(total);
      setShowResults(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const handleExit = () => {
    Alert.alert("Exit Quiz", "Are you sure you want to quit the quiz?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: () => router.back() },
    ]);
  };

  // Results screen
  if (showResults) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Finished!</Text>
        <Text style={styles.resultText}>
          Total Score: {score} / {quizData.settings.totalItems}
        </Text>
        {score >= quizData.settings.passingScore ? (
          <Text style={styles.passText}>🎉 Congratulations! You passed!</Text>
        ) : (
          <Text style={styles.failText}>😢 Aww don’t be sad, there’s always room for improvement!</Text>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit}>
          <Ionicons name="close-outline" size={32} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGridVisible(true)}>
          <Ionicons name="apps-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Question card */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      {/* Choices */}
      <View style={styles.choicesWrapper}>
        {question.type === "multichoice" &&
          question.choices.map((choice, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.choiceButton,
                { width: screenWidth * 0.9 },
                answers[question.id] === choice.text
                  ? { borderColor: "#48cae4" }
                  : { borderColor: theme.cardBorder },
              ]}
              onPress={() => handleSelectChoice(choice.text)}
            >
              <Text>{choice.text}</Text>
            </TouchableOpacity>
          ))}

        {question.type === "truefalse" &&
          ["True", "False"].map((choice, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.choiceButton,
                { width: screenWidth * 0.9 },
                answers[question.id] === choice
                  ? { borderColor: "#48cae4" }
                  : { borderColor: theme.cardBorder },
              ]}
              onPress={() => handleSelectChoice(choice)}
            >
              <Text>{choice}</Text>
            </TouchableOpacity>
          ))}

        {question.type === "multiselect" &&
          question.choices.map((choice, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.choiceButton,
                { width: screenWidth * 0.9 },
                (answers[question.id] || []).includes(choice.text)
                  ? { borderColor: "#48cae4" }
                  : { borderColor: theme.cardBorder },
              ]}
              onPress={() => handleToggleMultiSelect(choice.text)}
            >
              <Text>{choice.text}</Text>
            </TouchableOpacity>
          ))}

        {question.type === "enumeration" && (
          <TextInput
            style={[styles.input, { width: screenWidth * 0.9 }]}
            placeholder="Type your answer"
            value={answers[question.id] || ""}
            onChangeText={handleEnumeration}
          />
        )}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {quizData.settings.allowBack && currentQuestion > 0 ? (
            <>
            <TouchableOpacity style={[styles.navButton, { width: "48%" }]} onPress={handlePrev}>
                <Text style={styles.navText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, { width: "48%" }]} onPress={handleNext}>
                <Text style={styles.navText}>
                {currentQuestion + 1 === quizData.questions.length ? "Finish" : "Next"}
                </Text>
            </TouchableOpacity>
            </>
        ) : (
            <TouchableOpacity style={[styles.navButton, { width: "100%" }]} onPress={handleNext}>
            <Text style={styles.navText}>
                {currentQuestion + 1 === quizData.questions.length ? "Finish" : "Next"}
            </Text>
            </TouchableOpacity>
        )}
      </View>

      {/* Question grid modal */}
        <Modal visible={gridVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                {/* Header inside modal */}
                <View style={styles.modalHeader}>
                    <Text style={styles.title}>Jump to Question</Text>
                    <TouchableOpacity onPress={() => setGridVisible(false)}>
                    <Ionicons name="close-outline" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Question grid */}
                    <View style={styles.gridWrapper}>
                        {quizData.questions.map((item, index) => {
                            const isAnswered = answers[item.id];
                            const isClickable = quizData.settings.allowBack || index === currentQuestion;

                            return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                styles.gridItem,
                                { borderColor: isAnswered ? "#48cae4" : theme.cardBorder },
                                !isClickable && { opacity: 0.4 }, // show disabled visually
                                ]}
                                disabled={!isClickable} // 🔽 disables pressing if not allowed
                                onPress={() => {
                                if (isClickable) {
                                    setCurrentQuestion(index);
                                    setGridVisible(false);
                                }
                                }}
                            >
                                <Text>{index + 1}</Text>
                            </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  questionCard: {
    backgroundColor: "#f9f9f9",
    height: 150,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  questionText: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  choicesWrapper: { alignItems: "center" },
  choiceButton: {
    borderWidth: 2,
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  navRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    paddingVertical: 15,
    marginTop: "auto",   // 🔽 pushes it to the bottom
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: "#48cae4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  navText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 12,
  width: "85%",
  maxHeight: "70%",
},
modalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 15,
},
gridWrapper: {
  flexDirection: "row",
  flexWrap: "wrap",   // 🔽 wrap to next line if too many items
  justifyContent: "center",
},
gridItem: {
  borderWidth: 2,
  borderRadius: 8,
  padding: 15,
  margin: 8,
  minWidth: 50,
  alignItems: "center",
  justifyContent: "center",
},
  resultText: { fontSize: 18, textAlign: "center", marginBottom: 10 },
  passText: { color: "green", fontSize: 18, textAlign: "center" },
  failText: { color: "red", fontSize: 18, textAlign: "center" },
  closeButton: { marginTop: 20, backgroundColor: "#333", padding: 15, borderRadius: 8 },
  closeText: { color: "#fff", textAlign: "center" },
});

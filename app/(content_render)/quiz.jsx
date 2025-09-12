import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, Alert, TextInput, StyleSheet, Modal, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation, lockVisible } from "expo-router";
import Spacer from "../../components/Spacer";
import ThemedAlert from "../../components/ThemedAlert";
import DangerAlert from "../../components/DangerAlert";

export default function QuizScreen() {
  const { uri } = useLocalSearchParams(); 
  const router = useRouter();
  const navigation = useNavigation();

  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [lockedAnswers, setLockedAnswers] = useState({});

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [exitAlertVisible, setExitAlertVisible] = useState(false);


  const theme = {
    cardBorder: "#ccc",
    text: "#333",
    background: "#fff",
  };

  const screenWidth = Dimensions.get("window").width;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Fisher–Yates shuffle
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }


  // Load JSON file
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        let parsed;
        if (uri.startsWith("http")) {
          // 🌍 Remote file
          const response = await fetch(uri);
          const json = await response.json();
          parsed = json;
        } else {
          // 📂 Local file
          const jsonString = await FileSystem.readAsStringAsync(uri);
          parsed = JSON.parse(jsonString);
        }

        // Shuffle questions if enabled
        if (parsed.settings.shuffleQuestions) {
          parsed.questions = shuffleArray(parsed.questions);
        }

        // Shuffle choices of each question if enabled
        if (parsed.settings.shuffleChoices) {
          parsed.questions = parsed.questions.map((q) => {
            if (q.choices) {
              return { ...q, choices: shuffleArray(q.choices) };
            }
            return q;
          });
        }

        setQuizData(parsed);

        if (parsed.settings.mode === "close") {
          setPasswordModalVisible(true);
        }

      } catch (err) {
        console.error("Failed to load quiz JSON:", err);
        setAlertMessage("Unable to load quiz file.");
        setAlertVisible(true);
      }
    };
    loadQuiz();
  }, [uri]);


  if (!quizData) {
    return (
      <View style={styles.container}>
        <Text>Loading quiz...</Text>
      </View>
    );
  }

  // ✅ lock screen until password is entered
  if (quizData.settings.mode === "close" && !isUnlocked) {
    return (
      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.title}>Enter Password</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close-outline" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Password Input */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={enteredPassword}          // ✅ use correct state
              onChangeText={setEnteredPassword} // ✅ use correct setter
            />

            {/* Unlock Button */}
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => {
                if (enteredPassword === quizData.settings.password) {
                  setIsUnlocked(true);
                  setPasswordModalVisible(false);
                }
              }}
            >
              <Text style={styles.unlockText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }


  const question = quizData.questions[currentQuestion];

  const feedbackMessages = {
    multipleChoice: {
      correct: [
        "Great job! 🎉",
        "Nice work, that’s correct! ✅",
        "You nailed it! 💯"
      ],
      incorrect: [
        "Not quite, try again next time ❌",
        "Hmm, that wasn’t right 🤔",
        "Close, but not correct 😢"
      ]
    },
    trueFalse: {
      correct: [
        "Exactly right! 👍",
        "Correct answer! ✅",
        "You got it! 🎯"
      ],
      incorrect: [
        "Nope, that’s not it ❌",
        "That’s false 😕",
        "Oops, wrong choice 😢"
      ]
    },
    enumeration: {
      partial: [
        "Nice! You got some correct! ✨",
        "Good try, you got a few right! 👍",
        "Almost there, some answers were correct! 💡"
      ],
      perfect: [
        "Wow, you got them all correct! 🏆",
        "Perfect enumeration! ✅",
        "You listed everything right! 🎉"
      ],
      incorrect: [
        "None matched 😢, review again!",
        "Not correct, keep practicing 📘",
        "That didn’t match, try again 💭"
      ]
    },
    multiselect: {
      correct: [
        "Great selection! ✅",
        "Perfect choices! 🎯",
        "You picked all the right ones! 🏆"
      ],
      partial: [
        "Good try, you got some correct 👍",
        "Almost there, a few were right 💡",
        "Nice effort, but missing some answers ✨"
      ],
      incorrect: [
        "Oops, wrong picks ❌",
        "That didn’t work out 😕",
        "Try again, not correct 💭"
      ]
    }
  };

  function getRandomFeedback(type, result) {
    const messages = feedbackMessages[type][result];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function getBorderStyle(question, choice, answers, lockedAnswers, theme) {
    const isLocked = lockedAnswers[question.id];
    const userAnswer = answers[question.id];

    let borderColor = theme.cardBorder;

    // Multichoice
    if (question.type === "multichoice") {
      const isSelected = userAnswer === choice.text;

      if (isSelected && !isLocked) {
        borderColor = "#48cae4";
      }

      if (isLocked) {
        if (choice.points > 0 && isSelected) {
          borderColor = "green";
        } else if (choice.points === 0 && isSelected) {
          borderColor = "red";
        } else if (choice.points > 0) {
          borderColor = "green";
        }
      }
    }

    // True/False
    if (question.type === "truefalse") {
      const isSelected = userAnswer === choice;
      const correctAnswer = question.answer ? "True" : "False";

      if (isSelected && !isLocked) {
        borderColor = "#48cae4";
      }

      if (isLocked) {
        if (isSelected && choice === correctAnswer) {
          borderColor = "green";
        } else if (isSelected && choice !== correctAnswer) {
          borderColor = "red";
        } else if (choice === correctAnswer) {
          borderColor = "green";
        }
      }
    }

    // Multiselect
    if (question.type === "multiselect") {
      const userAnswers = userAnswer || [];
      const isSelected = userAnswers.includes(choice.text);
      const isCorrect = choice.points > 0;

      if (isSelected && !isLocked) {
        borderColor = "#48cae4";
      }

      if (isLocked) {
        if (isSelected && isCorrect) {
          borderColor = "green";
        } else if (isSelected && !isCorrect) {
          borderColor = "red";
        } else if (isCorrect) {
          borderColor = "green";
        }
      }
    }

    // Enumeration (applies to TextInput border)
    if (question.type === "enumeration" && isLocked) {
      const userAnsArray = (userAnswer || "")
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a !== "");

      const correctAnswers = question.answer.map((a) => a.toLowerCase());
      const correctCount = userAnsArray.filter((ans) =>
        correctAnswers.includes(ans)
      ).length;

      if (correctCount === correctAnswers.length && correctCount > 0) {
        borderColor = "green"; // all correct
      } else if (correctCount > 0) {
        borderColor = "yellow"; // partial
      } else {
        borderColor = "red"; // none correct
      }
    }

    return { borderColor };
  }



  // Selection handlers
  const handleSelectChoice = (choice) => {
    if (lockedAnswers[question.id]) return; // 🚫 prevent changes if locked

    setAnswers({ ...answers, [question.id]: choice });

    if (quizData.settings.instantFeedback) {
      let feedbackMsg;

      if (question.type === "multichoice") {
        const isCorrect = question.choices.some(
          (c) => c.text === choice && c.points > 0
        );
        feedbackMsg = {
          text: getRandomFeedback("multipleChoice", isCorrect ? "correct" : "incorrect"),
          color: isCorrect ? "green" : "red"
        };
      }

      if (question.type === "truefalse") {
        const isCorrect =
          (choice === "True" && question.answer === true) ||
          (choice === "False" && question.answer === false);

        feedbackMsg = {
          text: getRandomFeedback("trueFalse", isCorrect ? "correct" : "incorrect"),
          color: isCorrect ? "green" : "red"
        };
      }

      setFeedback(feedbackMsg);
      setLockedAnswers({ ...lockedAnswers, [question.id]: true });
    }
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
    const q = question; // current question

    if (quizData.settings.instantFeedback && !lockedAnswers[q.id]) {
      let feedbackMsg = null;

      if (q.type === "enumeration") {
        const userAnsArray = (answers[q.id] || "")
          .split(",")
          .map((a) => a.trim().toLowerCase())
          .filter((a) => a !== "");

        const correctAnswers = q.answer.map((a) => a.toLowerCase());
        const correctCount = userAnsArray.filter((ans) =>
          correctAnswers.includes(ans)
        ).length;

        let feedbackMsg;
        if (correctCount === correctAnswers.length && correctCount > 0) {
          feedbackMsg = { text: getRandomFeedback("enumeration", "perfect"), color: "green" };
        } else if (correctCount > 0) {
          feedbackMsg = { text: getRandomFeedback("enumeration", "partial"), color: "green" };
        } else {
          feedbackMsg = { text: getRandomFeedback("enumeration", "incorrect"), color: "red" };
        }

        setFeedback(feedbackMsg);
        setLockedAnswers({ ...lockedAnswers, [q.id]: true });
        return;
      }

      if (q.type === "multiselect") {
        const userAns = answers[q.id] || [];
        const correctChoices = q.choices.filter((c) => c.points > 0).map((c) => c.text);

        const correctPicked = userAns.filter((ans) => correctChoices.includes(ans));
        const wrongPicked = userAns.filter((ans) => !correctChoices.includes(ans));

        let feedbackMsg;
        if (wrongPicked.length > 0) {
          feedbackMsg = { text: getRandomFeedback("multiselect", "incorrect"), color: "red" };
        } else if (correctPicked.length === correctChoices.length) {
          feedbackMsg = { text: getRandomFeedback("multiselect", "correct"), color: "green" };
        } else if (correctPicked.length > 0) {
          feedbackMsg = { text: getRandomFeedback("multiselect", "partial"), color: "green" };
        } else {
          feedbackMsg = { text: getRandomFeedback("multiselect", "incorrect"), color: "red" };
        }

        setFeedback(feedbackMsg);
        setLockedAnswers({ ...lockedAnswers, [q.id]: true });
        return;
      }
    }

    // 🟢 if already locked or instantFeedback = false → move forward
    if (currentQuestion + 1 < quizData.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null); // 🧹 clear feedback when moving forward
    } else {
      // ✅ Calculate score at the end
      let total = 0;
      quizData.questions.forEach((q) => {
        if (q.type === "multichoice") {
          const userAns = answers[q.id];
          const correct = q.choices.find((c) => c.text === userAns && c.points > 0);
          if (correct) total += correct.points;
        } else if (q.type === "enumeration") {
          const userAnsArray = (answers[q.id] || "")
            .split(",")
            .map((a) => a.trim().toLowerCase())
            .filter((a) => a !== "");

          const correctAnswers = q.answer.map((a) => a.toLowerCase());
          let correctCount = 0;
          userAnsArray.forEach((ans) => {
            if (correctAnswers.includes(ans)) correctCount++;
          });

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
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setFeedback(null); // 🧹 clear feedback when going back
    }
  };

  const handleExit = () => {
    setExitAlertVisible(true);
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
          <Text style={styles.failText}>
            😢 Aww don’t be sad, there’s always room for improvement!
          </Text>
        )}

        {/* 🔽 Review Section if enabled */}
        {quizData.settings.review && (
          <FlatList
            data={quizData.questions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
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
            }}
          />
        )}

        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>

        <Spacer height={40} />
      </View>
    );
  }



  return (
    
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` },
          ]}
        />
      </View>

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

      {/* feedback msg */}
      <View style={styles.feedbackContainer}>
        {feedback && (
          <Text style={{ 
            color: feedback.color, 
            fontSize: 16, 
            fontWeight: "bold", 
            textAlign: "left" 
          }}>
            {feedback.text}
          </Text>
        )}
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
                getBorderStyle(question, choice, answers, lockedAnswers, theme),
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
                getBorderStyle(question, choice, answers, lockedAnswers, theme),
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
                getBorderStyle(question, choice, answers, lockedAnswers, theme),
              ]}
              onPress={() => handleToggleMultiSelect(choice.text)}
            >
              <Text>{choice.text}</Text>
            </TouchableOpacity>
          ))}

        {question.type === "enumeration" && (
          <TextInput
            style={[
              styles.input,
              { width: screenWidth * 0.9 },
              getBorderStyle(question, null, answers, lockedAnswers, theme),
            ]}
            placeholder="Type your answer"
            placeholderTextColor="#a0a0a0ff"
            value={answers[question.id] || ""}
            onChangeText={handleEnumeration}
            editable={!lockedAnswers[question.id]} // 🚫 prevent editing if locked
          />
        )}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {quizData.settings.allowBack && !quizData.settings.instantFeedback && currentQuestion > 0 ? (
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
                            const isClickable =!quizData.settings.instantFeedback &&
                              (quizData.settings.allowBack || index === currentQuestion);

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

        <ThemedAlert
          visible={alertVisible}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />

        <DangerAlert
          visible={exitAlertVisible}
          message="Are you sure you want to quit the quiz?"
          onCancel={() => setExitAlertVisible(false)}
          onConfirm={() => {
            setExitAlertVisible(false);
            router.back(); // exit quiz
          }}
        />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  progressBarBackground: {
    height: 6,
    width: "100%",
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#48cae4",
    borderRadius: 3,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
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
  feedbackContainer: { minHeight: 25,},
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
    color: "#000",
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  unlockButton: {
    backgroundColor: "#48cae4",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },

  unlockText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
    margin: 5,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
    resultText: { fontSize: 18, textAlign: "center", marginBottom: 10 },
    passText: { color: "green", fontSize: 18, textAlign: "center" },
    failText: { color: "red", fontSize: 18, textAlign: "center" },
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
  reviewQuestion: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  reviewLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  reviewUser: {
    color: "red",
    fontWeight: "600",
  },
  reviewCorrect: {
    color: "green",
    fontWeight: "600",
  },

});

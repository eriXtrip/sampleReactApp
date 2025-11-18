// samplereactnative/app/(content_render)/quiz.jsx

import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, Alert, TextInput, StyleSheet, Modal, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation, lockVisible } from "expo-router";

import Spacer from "../../components/Spacer";
import ThemedAlert from "../../components/ThemedAlert";
import DangerAlert from "../../components/DangerAlert";
import LoadingAnimation from "../../components/loadingAnimation";

import QuizHeader from "../../components/QuizHeader";
import ProgressBar from "../../components/ProgressBar";
import QuestionCard from "../../components/QuestionCard";
import NavButtons from "../../components/NavButtons";
import QuestionGridModal from "../../components/QuestionGridModal";
import ResultsScreen from "../../components/ResultsScreen";
import PasswordModal from "../../components/PasswordModal";
import lessonData from "../../data/lessonData";
import { useSQLiteContext } from "expo-sqlite";



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
  const { feedbackMessages } = lessonData;
  const [lockedAnswers, setLockedAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [exitAlertVisible, setExitAlertVisible] = useState(false);

  const db = useSQLiteContext();

  const getCurrentUserId = async () => {
    try {
      const result = await db.getFirstAsync(`SELECT user_id FROM users LIMIT 1`);
      console.log("Current user ID:", result?.user_id);
      return result?.user_id || null;
    } catch (err) {
      console.error("❌ Error fetching current user:", err);
      return null;
    }
  };

  const saveScore = async (finalScore, maxScore) => {
    const now = new Date().toISOString();
    const userId = await getCurrentUserId();
    if (!userId) return;

    try {
      await db.runAsync(
        `INSERT INTO pupil_test_scores (pupil_id, test_id, score, max_score, taken_at) 
        VALUES (?, ?, ?, ?, ?)`,
        [userId, quizData.quizId, finalScore, maxScore, now]
      );
      console.log("✅ Quiz score saved:", finalScore, "/", maxScore);
    } catch (err) {
      console.error("❌ Error saving score:", err);
    }
  };

  const saveAnswers = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    try {
      for (const q of quizData.questions) {
        const userAns = answers[q.id];

        // MULTIPLE CHOICE
        if (q.type === "multichoice") {
          const selected = q.choices.find(c => c.text === userAns);
          const choiceId = selected ? selected.choice_id : null;

          await db.runAsync(
            `INSERT INTO pupil_answers (pupil_id, question_id, choice_id, is_synced, server_answer_id)
            VALUES (?, ?, ?, 0, NULL)`,
            [userId, q.id, choiceId]
          );
        }

        // TRUE/FALSE
        else if (q.type === "truefalse") {
          const selected = q.choices.find(c => c.text === userAns);
          const choiceId = selected ? selected.choice_id : null;

          await db.runAsync(
            `INSERT INTO pupil_answers (pupil_id, question_id, choice_id, is_synced, server_answer_id)
            VALUES (?, ?, ?, 0, NULL)`,
            [userId, q.id, choiceId]
          );
        }

        // MULTISELECT
        else if (q.type === "multiselect") {
          const selectedChoices = userAns || [];

          for (const ansText of selectedChoices) {
            const selected = q.choices.find(c => c.text === ansText);
            const choiceId = selected ? selected.choice_id : null;

            await db.runAsync(
              `INSERT INTO pupil_answers (pupil_id, question_id, choice_id, is_synced, server_answer_id)
              VALUES (?, ?, ?, 0, NULL)`,
              [userId, q.id, choiceId]
            );
          }
        }

        // ENUMERATION (NO choice_id)
        else if (q.type === "enumeration") {
          await db.runAsync(
            `INSERT INTO pupil_answers (pupil_id, question_id, choice_id, answer_text, is_synced, server_answer_id)
            VALUES (?, ?, NULL, ?, 0, NULL)`,
            [userId, q.id, userAns || ""]
          );
        }
      }

      console.log("✅ Answers saved correctly with proper choice_id mapping");
    } catch (err) {
      console.error("❌ Error saving answers:", err);
    }
  };

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
        setStartedAt(new Date().toISOString());

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
    return <LoadingAnimation />
  }


  const question = quizData.questions[currentQuestion];


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
      const correctAnswer = Array.isArray(question.answer) 
        ? question.answer[0] 
        : question.answer;

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

  const handleNext = async () => {
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
        let questionPoints = 0; // points for this question only

        if (q.type === "multichoice") {
          const userAns = answers[q.id];
          const correct = q.choices.find((c) => c.text === userAns && c.points > 0);
          if (correct) questionPoints = correct.points;

        } else if (q.type === "enumeration") {
          const userAnsArray = (answers[q.id] || "")
            .split(",")
            .map(a => a.trim().toLowerCase())
            .filter(a => a !== "");
          const correctAnswers = q.answer.map(a => a.toLowerCase());
          questionPoints = userAnsArray.filter(ans => correctAnswers.includes(ans)).length;

        } else if (q.type === "truefalse") {
          if (answers[q.id] === q.answer[0]) questionPoints = q.points;

        } else if (q.type === "multiselect") {
          const userAns = answers[q.id] || [];
          q.choices.forEach(c => {
            if (userAns.includes(c.text)) questionPoints += c.points;
          });
        }

        console.log(`Question: ${q.question}`);
        console.log(`User answer: ${answers[q.id]}`);
        console.log(`Points awarded: ${questionPoints}`);

        total += questionPoints; // ✅ add points for this question to total
      });

      setScore(total);
      setShowResults(true);
      await saveScore(total, maxScore);
      await saveAnswers();

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
      <ResultsScreen
        score={score}
        quizData={quizData}
        answers={answers}
        startedAt={startedAt}
        onClose={() => router.back()}
      />
    );
  }

  return (
    
    <View style={styles.container}>
      {/* Progress Bar */}
      <ProgressBar current={currentQuestion} total={quizData.questions.length} />

      {/* Header */}
      <QuizHeader 
        onExit={handleExit} 
        onGrid={() => setGridVisible(true)} 
        theme={theme}
      />

      {/* Question card */}
      <QuestionCard question={question.question} />

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
      <NavButtons
        showPrev={quizData.settings.allowBack && !quizData.settings.instantFeedback && currentQuestion > 0}
        showNext={true}
        isLast={currentQuestion + 1 === quizData.questions.length}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Question grid modal */}
      <QuestionGridModal
        visible={gridVisible}
        onClose={() => setGridVisible(false)}
        questions={quizData.questions}
        answers={answers}
        currentQuestion={currentQuestion}
        setCurrentQuestion={setCurrentQuestion}
        quizData={quizData}
        theme={theme}
      />

      {/* Password Modal */}
      {quizData.settings.mode === "close" && !isUnlocked && (
        <PasswordModal
          visible={passwordModalVisible}
          correctPassword={quizData.settings.password}
          onClose={() => router.back()}
          onUnlock={() => {
            setIsUnlocked(true);
            setPasswordModalVisible(false);
          }}
        />
      )}

       {/* Alerts */}
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
});

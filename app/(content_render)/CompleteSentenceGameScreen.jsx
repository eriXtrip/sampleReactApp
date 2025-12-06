import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import LottieView from "lottie-react-native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Spacer from "../../components/Spacer";
import BadgeReward from "../../components/BadgeReward";
import TryAgainModal from "../../components/TryAgainModal";
import ThemedView from "../../components/ThemedView";
import LoadingAnimation from "../../components/loadingAnimation";
import { useSQLiteContext } from 'expo-sqlite';
import { saveAchievementAndUpdateContent } from "../../utils/achievementUtils";
import { usePreventScreenCapture } from "expo-screen-capture";



const { width, height } = Dimensions.get("window");
const cardWidth = width - 60;
const cardHeight = height / 2;

export default function CompleteSentenceScreen() {
  const { uri, content_id } = useLocalSearchParams();
  console.log("Complete Sentence Params:", { uri, content_id });
  const router = useRouter();
  const navigation = useNavigation();

  //usePreventScreenCapture();

  const db = useSQLiteContext();

  const [gameData, setGameData] = useState([]);
  const [gameBadge, setGameBadge] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showBadge, setShowBadge] = useState(false);
  const [badge, setBadge] = useState(null);
  const [showTryAgain, setShowTryAgain] = useState(false);    

  // NEW states
  const [answerBoxes, setAnswerBoxes] = useState([]); // array of chars for boxes
  const [choices, setChoices] = useState([]); // fixed choices for this item
  const [usedIndices, setUsedIndices] = useState([]); // indices of choices used in selection order

  const [points, setPoints] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!uri) {
      Alert.alert("Error", "Game file not provided.");
      return;
    }

    const loadGame = async () => {
      try {
        let parsed;
        if (uri.startsWith("http")) {
          const response = await fetch(uri);
          parsed = await response.json();
        } else {
          const jsonString = await FileSystem.readAsStringAsync(uri);
          parsed = JSON.parse(jsonString);
        }
        setGameData(parsed.items || []);
        setGameBadge(parsed.badge || null);
      } catch (err) {
        console.error("Failed to load JSON:", err);
        Alert.alert("Error", "Unable to load game file.");
      }
    };
    loadGame();
  }, [uri]);

  const currentCard = gameData[currentIndex];

  // shuffle helper
  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  // Generate choices ONCE per card
  const generateChoices = (answer) => {
    const letters = answer.split("");
    const neededRandoms = Math.max(0, 11 - letters.length);

    // pick random letters excluding answer letters so randoms don't duplicate answer letters
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("").filter((c) => !letters.includes(c));
    const shuffledAlpha = shuffleArray([...alphabet]);
    const randomLetters = shuffledAlpha.slice(0, neededRandoms);

    // include exact answer letters, plus randoms, then shuffle final list
    return shuffleArray([...letters, ...randomLetters]);
  };

  // When card changes, set up boxes and fixed choices
  useEffect(() => {
    if (!currentCard) return;
    const ans = currentCard.answer || "";
    setAnswerBoxes(Array(ans.length).fill(""));
    setUsedIndices([]);
    setIsCorrect(false);
    flipAnim.setValue(0);

    const newChoices = generateChoices(ans);
    setChoices(newChoices);
  }, [currentIndex, currentCard]);

  const handleLetterPress = (letter, choiceIndex) => {
    if (isCorrect) return;
    if (usedIndices.includes(choiceIndex)) return; // cannot reuse same choice index

    // find first empty box
    const emptyIndex = answerBoxes.findIndex((b) => b === "");
    if (emptyIndex === -1) return;

    const newBoxes = [...answerBoxes];
    newBoxes[emptyIndex] = letter;
    setAnswerBoxes(newBoxes);
    setUsedIndices((prev) => [...prev, choiceIndex]); // push this choice index

    const formed = newBoxes.join("");
    if (formed === currentCard.answer) {
      setIsCorrect(true);
      setPoints((p) => p + 1);
      Animated.timing(flipAnim, { toValue: 180, duration: 500, useNativeDriver: false }).start();
    } else if (formed.length === currentCard.answer.length && formed !== currentCard.answer) {
      Alert.alert("Try again!", "Check your spelling.");
      setAnswerBoxes(Array(currentCard.answer.length).fill(""));
      setUsedIndices([]);
    }
  };

  const handleBackspace = () => {
    if (isCorrect) return;
    // find last filled box
    let lastPos = -1;
    for (let i = answerBoxes.length - 1; i >= 0; i--) {
      if (answerBoxes[i] !== "") {
        lastPos = i;
        break;
      }
    }
    if (lastPos === -1) return;

    const newBoxes = [...answerBoxes];
    newBoxes[lastPos] = "";
    setAnswerBoxes(newBoxes);

    // remove last used index from stack (un-highlight that choice)
    setUsedIndices((prev) => prev.slice(0, -1));
  };

  const nextCard = () => {
    if (currentIndex < gameData.length - 1) {
        setCurrentIndex((prev) => prev + 1);
    } else {
        // ✅ Show badge modal with data from JSON
        if (gameBadge) {
            setBadge(gameBadge);
            setShowBadge(true);
        } else {
            setShowTryAgain(true);
        }
    }
  };


  if (!currentCard) {
    return <LoadingAnimation />;
  }

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.scoreText}>Points: {points}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / gameData.length) * 100}%` }]} />
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        {/* Front side */}
        <Animated.View style={[styles.card, { transform: [{ rotateY: frontRotate }], backfaceVisibility: "hidden" }]}>
          <Text style={styles.sentence}>
            {currentCard.sentence1} "____" {currentCard.sentence2}
          </Text>
        </Animated.View>

        {/* Back side (definition) */}
        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }], backfaceVisibility: "hidden" }]}>
          <Text style={styles.definition}>{currentCard.definition}</Text>
        </Animated.View>
      </View>

      {/* Input + Choices (hidden when correct) */}
      {!isCorrect && (
        <>
          {/* Input Boxes */}
          <View style={styles.inputRow}>
            {answerBoxes.map((char, i) => (
              <View key={i} style={styles.inputBox}>
                <Text style={styles.inputLetter}>{char}</Text>
              </View>
            ))}
          </View>

          {/* Choices (fixed for the item) */}
          <View style={styles.choices}>
            {choices.map((letter, i) => {
              const isUsed = usedIndices.includes(i);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.choiceBtn, isUsed && styles.choiceBtnUsed]}
                  onPress={() => handleLetterPress(letter, i)}
                  disabled={isUsed}
                >
                  <Text style={[styles.choiceText, isUsed && styles.choiceTextUsed]}>{letter}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Backspace */}
            <TouchableOpacity style={[styles.choiceBtn, { backgroundColor: "#ff6b6b" }]} onPress={handleBackspace}>
              <Ionicons name="backspace-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Next button only when correct */}
      {isCorrect && (
        <TouchableOpacity style={styles.nextBtn} onPress={nextCard}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      )}

      <Spacer height={20} />

      <BadgeReward
        visible={showBadge}
        badge={badge}   // ✅ comes directly from JSON
        onClose={async () => {
            console.log("Param to be sent:", { badge, content_id });
            await saveAchievementAndUpdateContent(db, badge, content_id);
            setShowBadge(false)
            router.back();
        }}
      />

      <TryAgainModal
        visible={showTryAgain}
        onClose={() => {
            setShowTryAgain(false);
            router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  lottie: {
    width: 120,
    height: 120,
    alignSelf: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  scoreText: { fontWeight: "bold", fontSize: 16 },
  progressBar: {
    height: 10,
    backgroundColor: "#eee",
    marginHorizontal: 20,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#48cae4",
    borderRadius: 5,
  },
  cardContainer: {
    height: cardHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: cardWidth,
    height: "70%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ddf6fc91",
    position: "absolute",
    backfaceVisibility: "hidden",
    borderWidth: 1,
    borderColor: "#92cbd6ff",
  },
  cardBack: { backgroundColor: "#ddf6fc91", },
  sentence: { fontSize: 22, textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginVertical: 15,
    top: -10,
  },
  inputBox: {
    width: 40,
    height: 50,
    margin: 4,
    borderWidth: 2,
    borderColor: "#48cae4",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f901",
  },
  inputLetter: { fontSize: 20, fontWeight: "bold", color: "#333" },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
  },
  choiceBtn: {
    backgroundColor: "#e0e0e0",
    padding: 12,
    margin: 6,
    borderRadius: 8,
    minWidth: 45,
    alignItems: "center",
  },
  choiceBtnUsed: { backgroundColor: "#bdbdbd" },
  choiceText: { fontSize: 18, fontWeight: "bold" },
  choiceTextUsed: { color: "#fff" },
  definition: { fontSize: 18, textAlign: "center" },
  nextBtn: {
    position: "absolute",   // ✅ stick it to bottom
    bottom: 60,             // distance from screen bottom
    width: "85%",
    backgroundColor: "#48cae4",
    padding: 15,
    borderRadius: 10,
    alignSelf: "center",
 },
  nextText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});

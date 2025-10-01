import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import BadgeReward from "../../components/BadgeReward";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import LoadingAnimation from "../../components/loadingAnimation";
import { resolveLocalPath } from "../../utils/resolveLocalPath";
import { useSQLiteContext } from 'expo-sqlite';
import { saveAchievementAndUpdateContent } from "../../utils/achievementUtils";

export default function AngleHuntScreen() {
  const router = useRouter();
  const { uri, content_id } = useLocalSearchParams();
  console.log("Game with img:", { uri, content_id });
  const [gameData, setGameData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showBadge, setShowBadge] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [questionSource, setQuestionSource] = useState(null);
  const [choiceSources, setChoiceSources] = useState({});
  
  const db = useSQLiteContext();

  // Load JSON data
  useEffect(() => {
    const loadJson = async () => {
      try {
        let parsed;
        if (uri.startsWith("http")) {
          const response = await fetch(uri);
          parsed = await response.json();
          console.log("Using server file");
        } else {
          const jsonString = await FileSystem.readAsStringAsync(uri);
          parsed = JSON.parse(jsonString);
          console.log("Using local file");
        }
        setGameData(parsed);
      } catch (err) {
        console.error("Failed to load JSON:", err);
        alert("Unable to load game JSON.");
      }
    };
    loadJson();
  }, [uri]);

  // Define currentItem
  const currentItem = gameData ? gameData.items[currentIndex] : null;

  // Preload question & choice images
  useEffect(() => {
    if (!gameData || !currentItem) {
      setQuestionSource(null);
      setChoiceSources({});
      return;
    }

    const loadImages = async () => {
      // Question
      if (currentItem.questionType === "image") {
        const localUri = currentItem.file ? resolveLocalPath(currentItem.file) : null;
        if (localUri) {
          const info = await FileSystem.getInfoAsync(localUri);
          console.log(`Checking question image ${localUri}: ${info.exists ? "exists" : "does not exist"}`);
          const source = info.exists ? localUri : currentItem.question;
          console.log(`Using questionSource: ${source}`);
          setQuestionSource(source);
        } else {
          const source = currentItem.question;
          console.log(`Using questionSource (no file): ${source}`);
          setQuestionSource(source);
        }
      } else {
        setQuestionSource(null);
      }

      // Choices
      const choiceMap = {};
      for (const choice of currentItem.choices) {
        if (choice.type === "image") {
          const localUri = choice.file ? resolveLocalPath(choice.file) : null;
          if (localUri) {
            const info = await FileSystem.getInfoAsync(localUri);
            console.log(`Checking choice image ${localUri}: ${info.exists ? "exists" : "does not exist"}`);
            const source = info.exists ? localUri : choice.img;
            console.log(`Using choiceSource for ${choice.id}: ${source}`);
            choiceMap[choice.id] = source;
          } else {
            const source = choice.img;
            console.log(`Using choiceSource for ${choice.id} (no file): ${source}`);
            choiceMap[choice.id] = source;
          }
        }
      }
      setChoiceSources(choiceMap);
    };

    loadImages();
  }, [gameData, currentItem]);

  // Show loading animation while gameData is null
  if (!gameData) {
    return <LoadingAnimation />;
  }

  const handleChoice = (choice) => {
    setSelectedChoice(choice.id);
    if (choice.id === currentItem.answer) {
      setTimeout(() => {
        if (currentIndex + 1 < gameData.items.length) {
          setCurrentIndex(currentIndex + 1);
          setSelectedChoice(null);
        } else {
          setShowBadge(true);
        }
      }, 400);
    } else {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        setSelectedChoice(null);
      }, 1000);
    }
  };

  const renderQuestion = () => {
    if (currentItem.questionType === "image" && !questionSource) {
      console.log("No questionSource for image question, showing placeholder");
      return <ThemedText style={styles.questionText}>Loading image...</ThemedText>;
    }

    if (currentItem.questionType === "text") {
      return <Text style={styles.questionText}>{currentItem.question}</Text>;
    } else {
      return (
        <Image
          source={{ uri: questionSource }}
          style={styles.questionImage}
          resizeMode="contain"
          onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
        />
      );
    }
  };

  const renderChoices = () => {
    const isImageChoices = currentItem.choices[0].type === "image";
    let numColumns = 1;
    if (isImageChoices) {
      numColumns = 2;
    } else if (currentItem.choices.length === 4) {
      numColumns = 2;
    } else if (currentItem.choices.length === 6) {
      numColumns = 2;
    }

    const rows = [];
    for (let i = 0; i < currentItem.choices.length; i += numColumns) {
      rows.push(currentItem.choices.slice(i, i + numColumns));
    }

    return rows.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.choiceRow}>
        {row.map((choice) => {
          const isSelected = selectedChoice === choice.id;
          return (
            <TouchableOpacity
              key={choice.id}
              style={[
                styles.choiceButton,
                {
                  borderColor: isSelected ? "#48cae4" : "#ccc",
                  width:
                    isImageChoices || currentItem.choices.length === 4
                      ? (Dimensions.get("window").width - 60) / 2
                      : "45%",
                },
              ]}
              onPress={() => handleChoice(choice)}
            >
              {choice.type === "text" ? (
                <Text style={styles.choiceText}>{choice.label}</Text>
              ) : (
                choiceSources[choice.id] && (
                  <Image
                    source={{ uri: choiceSources[choice.id] }}
                    style={styles.choiceImage}
                    resizeMode="contain"
                    onError={(e) => console.log("Choice image load error:", e.nativeEvent.error)}
                  />
                )
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const progress = ((currentIndex + 1) / gameData.items.length) * 100;

  return (
    <ThemedView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Badge Modal */}
      <BadgeReward
        visible={showBadge}
        badge={gameData.badge}
        onClose={async () => {
            console.log("Param to be sent:", { gameBadge: gameData.badge, content_id });
            await saveAchievementAndUpdateContent(db, gameData.badge, content_id);
            setShowBadge(false)
            router.back();
        }}
      />

      {/* Question */}
      <View style={styles.questionContainer}>{renderQuestion()}</View>

      {/* Choices */}
      <ScrollView contentContainerStyle={styles.choicesContainer}>
        {renderChoices()}
      </ScrollView>

      {/* Custom Alert */}
      <Modal transparent visible={showAlert} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <ThemedText style={styles.alertText}>
              ❌ Wrong answer! Try again.
            </ThemedText>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 10 },
  progressBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 15,
  },
  progressBarFill: { height: 12, backgroundColor: "#48cae4", borderRadius: 10 },
  questionContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#92cbd6ff",
    backgroundColor: "#ddf6fc1f",
    minHeight: 100,
    padding: 15,
    width: "100%",
  },
  questionText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    padding: 10,
    paddingVertical: 30,
  },
  questionImage: {
    width: screenWidth - 40,
    height: 200,
    borderRadius: 10,
    marginVertical: 5,
  },
  choicesContainer: { justifyContent: "center", alignItems: "center" },
  choiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  choiceButton: {
    padding: 15,
    paddingVertical: 20,
    borderWidth: 2,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: "center",
    backgroundColor: "#f9f9f944",
  },
  choiceText: { fontSize: 18, fontWeight: "bold" },
  choiceImage: { width: (screenWidth - 80) / 2, height: 120, borderRadius: 10 },
  progressText: { textAlign: "center", marginTop: 20, fontSize: 16, fontWeight: "bold" },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#48cae4",
  },
  alertText: { fontSize: 18, fontWeight: "bold", color: "#333", textAlign: "center" },
});
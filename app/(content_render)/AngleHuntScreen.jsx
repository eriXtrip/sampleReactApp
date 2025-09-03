// app/(content_render)/AngleHuntScreen.jsx
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

export default function AngleHuntScreen() {
  const router = useRouter();
  const { mathUri } = useLocalSearchParams();
  const [gameData, setGameData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showBadge, setShowBadge] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const loadJson = async () => {
      try {
        let parsed;
        if (mathUri.startsWith("http")) {
          const response = await fetch(mathUri);
          parsed = await response.json();
        } else {
          const jsonString = await FileSystem.readAsStringAsync(mathUri);
          parsed = JSON.parse(jsonString);
        }
        setGameData(parsed);
      } catch (err) {
        console.error("Failed to load JSON:", err);
        alert("Unable to load game JSON.");
      }
    };
    loadJson();
  }, [mathUri]);

  if (!gameData) {
    return (
      <View style={styles.container}>
        <Text>Loading game...</Text>
      </View>
    );
  }

  const currentItem = gameData.items[currentIndex];

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
    if (currentItem.questionType === "text") {
      return <Text style={styles.questionText}>{currentItem.question}</Text>;
    } else {
      return (
        <Image
          source={{ uri: currentItem.question }}
          style={styles.questionImage}
          resizeMode="contain"
        />
      );
    }
  };

  const renderChoices = () => {
    const isImageChoices = currentItem.choices[0].type === "image";
    const numColumns = isImageChoices ? 2 : currentItem.choices.length === 6 ? 2 : 1;
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
                { borderColor: isSelected ? "#48cae4" : "#ccc", width: isImageChoices ? (Dimensions.get("window").width - 60) / 2 : "45%" },
              ]}
              onPress={() => handleChoice(choice)}
            >
              {choice.type === "text" ? (
                <Text style={styles.choiceText}>{choice.label}</Text>
              ) : (
                <Image source={{ uri: choice.img }} style={styles.choiceImage} resizeMode="contain" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const progress = ((currentIndex + 1) / gameData.items.length) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Badge Modal */}
      <BadgeReward visible={showBadge} badge={gameData.badge} onClose={() => router.back()} />

      {/* Question */}
      <View style={styles.questionContainer}>{renderQuestion()}</View>

      {/* Choices */}
      <ScrollView contentContainerStyle={styles.choicesContainer}>{renderChoices()}</ScrollView>

      {/* Custom Alert */}
      <Modal transparent visible={showAlert} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>❌ Wrong answer! Try again.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  progressBarBackground: { width: "100%", height: 12, backgroundColor: "#eee", borderRadius: 10, marginBottom: 15 },
  progressBarFill: { height: 12, backgroundColor: "#48cae4", borderRadius: 10 },
  questionContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#92cbd6ff",
    backgroundColor: "#ddf6fc91",
    minHeight: 100,  // minimum height for text
    padding: 15,
    width: "100%",
  },
  questionText: { fontSize: 22, fontWeight: "bold", textAlign: "center", padding: 50, },
  questionImage: {
    width: screenWidth - 40,
    height: 200,
    borderRadius: 10,
    marginVertical: 5,
  },
  choicesContainer: { justifyContent: "center", alignItems: "center" },
  choiceRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 12 },
  choiceButton: {
    padding: 15,
    borderWidth: 2,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  choiceText: { fontSize: 18, fontWeight: "bold" },
  choiceImage: { width: (screenWidth - 80) / 2, height: 120, borderRadius: 10 },
  progressText: { textAlign: "center", marginTop: 20, fontSize: 16, fontWeight: "bold" },
  alertOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  alertBox: { backgroundColor: "#fff", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#48cae4" },
  alertText: { fontSize: 18, fontWeight: "bold", color: "#333", textAlign: "center" },
});

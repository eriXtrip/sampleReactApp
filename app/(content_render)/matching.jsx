// app/(content_render)/AngleHuntScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { useRouter, useLocalSearchParams } from "expo-router";
import BadgeReward from "../../components/BadgeReward";

export default function AngleHuntScreen() {
  const router = useRouter();
  const { mathUri } = useLocalSearchParams();
  const [gameData, setGameData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showBadge, setShowBadge] = useState(false);

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
        Alert.alert("Error", "Unable to load game JSON.");
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
      }, 500);
    } else {
      Alert.alert("Oops!", "Wrong answer, try again.");
      setSelectedChoice(null);
    }
  };

  const renderQuestion = () => {
    if (currentItem.questionType === "text") {
      return <Text style={styles.questionText}>{currentItem.question}</Text>;
    } else if (currentItem.questionType === "image") {
      return (
        <Image
          source={{ uri: currentItem.question }}
          style={styles.questionImage}
          resizeMode="contain"
        />
      );
    }
  };

  const renderChoice = (choice) => {
    const isSelected = selectedChoice === choice.id;
    const borderColor = isSelected ? "#48cae4" : "#ccc";

    return (
      <TouchableOpacity
        key={choice.id}
        style={[styles.choiceButton, { borderColor }]}
        onPress={() => handleChoice(choice)}
      >
        {choice.type === "text" ? (
          <Text style={styles.choiceText}>{choice.label}</Text>
        ) : (
          <Image
            source={{ uri: choice.img }}
            style={styles.choiceImage}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Badge Modal */}
      {gameData.badge && showBadge && (
        <BadgeReward
          visible={showBadge}
          badge={gameData.badge}
          onClose={() => {
            setShowBadge(false);
            router.back();
          }}
        />
      )}

      {/* Question */}
      <View style={styles.questionContainer}>{renderQuestion()}</View>

      {/* Choices */}
      <ScrollView contentContainerStyle={styles.choicesContainer}>
        {currentItem.choices.map((choice) => renderChoice(choice))}
      </ScrollView>

      {/* Progress */}
      <Text style={styles.progressText}>
        Question {currentIndex + 1} of {gameData.items.length}
      </Text>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, justifyContent: "center" },
  questionContainer: { marginBottom: 20, alignItems: "center" },
  questionText: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  questionImage: { width: screenWidth - 40, height: 200, borderRadius: 10 },
  choicesContainer: { justifyContent: "center", alignItems: "center" },
  choiceButton: {
    width: screenWidth - 60,
    padding: 15,
    borderWidth: 2,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  choiceText: { fontSize: 18, fontWeight: "bold" },
  choiceImage: { width: screenWidth - 80, height: 120, borderRadius: 10 },
  progressText: { textAlign: "center", marginTop: 20, fontSize: 16, fontWeight: "bold" },
});

import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import * as Speech from "expo-speech";
import Spacer from "../../components/Spacer";

export default function SpeakGameScreen() {
  const { speakUri } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const [gameData, setGameData] = useState(null);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);
  const [voiceIdentifier, setVoiceIdentifier] = useState(null);

  const theme = {
    cardBorder: "#ccc",
    text: "#333",
    background: "#fff",
  };

  const screenWidth = Dimensions.get("window").width;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const loadGame = async () => {
        try {
        let parsed;
        if (speakUri.startsWith("http")) {
            const response = await fetch(speakUri);
            const json = await response.json();
            parsed = json;
        } else {
            const jsonString = await FileSystem.readAsStringAsync(speakUri);
            parsed = JSON.parse(jsonString);
        }
        setGameData(parsed);

        // Log all available voices
        const voices = await Speech.getAvailableVoicesAsync();
        //console.log("Available voices:", voices);

        // Pick a voice (example: first English US voice)
        const selectedVoice = voices.find(v => v.language === "en-US")?.identifier || null;
        setVoiceIdentifier(selectedVoice);

        } catch (err) {
        console.error("Failed to load speak JSON:", err);
        Alert.alert("Error", "Unable to load game file.");
        }
    };
    loadGame();
    }, [speakUri]);

  if (!gameData) {
    return (
      <View style={styles.container}>
        <Text>Loading game...</Text>
      </View>
    );
  }

  const sentence = gameData.items[currentSentence].sentence;

  const handleSpeak = () => {
    if (!voiceIdentifier) {
      Alert.alert("Voice not ready", "Please wait a moment.");
      return;
    }
    Speech.speak(sentence, {
      voice: voiceIdentifier, // hardcoded voice
      rate: 1.0, // speaking speed (0.0 to 1.0)
      pitch: 1.0, // voice pitch
    });
  };

  const handleNext = () => {
    if (currentSentence + 1 < gameData.items.length) {
      setCurrentSentence(currentSentence + 1);
    } else {
      Alert.alert("Finished", "You have completed all sentences.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  const handlePrev = () => {
    if (currentSentence > 0) {
      setCurrentSentence(currentSentence - 1);
    }
  };

  const handleExit = () => {
    Alert.alert("Exit Game", "Are you sure you want to quit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View
          style={[styles.progressBarFill, { width: `${((currentSentence + 1) / gameData.items.length) * 100}%` }]}
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

      {/* Sentence Card */}
      <View style={styles.sentenceCard}>
        <Text style={styles.sentenceText}>{sentence}</Text>
        
      </View>
      
    {/* Mic button */}
    <TouchableOpacity style={styles.micButton} onPress={handleSpeak}>
        <Ionicons name="mic-outline" size={36} color="#48cae4" />
    </TouchableOpacity>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {currentSentence > 0 && (
          <TouchableOpacity style={[styles.navButton, { width: "48%" }]} onPress={handlePrev}>
            <Text style={styles.navText}>Prev</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, { width: currentSentence > 0 ? "48%" : "100%" }]}
          onPress={handleNext}
        >
          <Text style={styles.navText}>
            {currentSentence + 1 === gameData.items.length ? "Finish" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sentence grid modal */}
      <Modal visible={gridVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.title}>Jump to Sentence</Text>
              <TouchableOpacity onPress={() => setGridVisible(false)}>
                <Ionicons name="close-outline" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.gridWrapper}>
              {gameData.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.gridItem, { borderColor: index === currentSentence ? "#48cae4" : theme.cardBorder }]}
                  onPress={() => {
                    setCurrentSentence(index);
                    setGridVisible(false);
                  }}
                >
                  <Text>{index + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  progressBarBackground: { height: 6, width: "100%", backgroundColor: "#eee", borderRadius: 3, overflow: "hidden", marginBottom: 15 },
  progressBarFill: { height: "100%", backgroundColor: "#48cae4", borderRadius: 3 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  sentenceCard: { backgroundColor: "#f9f9f9", height: 180, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  sentenceText: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
  micButton: { padding: 10, backgroundColor: "#fff", borderRadius: 50, borderWidth: 1, borderColor: "#48cae4" },
  navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, marginTop: "auto", marginBottom: 20 },
  navButton: { backgroundColor: "#48cae4", padding: 15, borderRadius: 8, alignItems: "center" },
  navText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "85%", maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  gridWrapper: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  gridItem: { borderWidth: 2, borderRadius: 8, padding: 15, margin: 5, minWidth: 50, alignItems: "center", justifyContent: "center" },
});

import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Dimensions, 
  Animated,
  Platform 
} from "react-native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import Spacer from "../../components/Spacer";
import { Ionicons } from "@expo/vector-icons";
import BadgeReward from "../../components/BadgeReward";
import LoadingAnimation from "../../components/loadingAnimation";
import { useSQLiteContext } from 'expo-sqlite';
import { saveAchievementAndUpdateContent } from "../../utils/achievementUtils";
import { usePreventScreenCapture } from "expo-screen-capture";

export default function FlashCardScreen() {
  const { uri, content_id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const db = useSQLiteContext();

  usePreventScreenCapture();

  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [knowCount, setKnowCount] = useState(0);
  const [notKnowCount, setNotKnowCount] = useState(0);
  const [gameBadge, setGameBadge] = useState(null);
  const [showBadge, setShowBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth - 60;
  const cardHeight = screenWidth * 1.35;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!uri) {
      Alert.alert("Error", "Flashcard file not provided.");
      router.back();
      return;
    }

    loadFlashcards();
  }, [uri]);

  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      let parsed;
      if (uri.startsWith("http")) {
        const response = await fetch(uri);
        if (!response.ok) throw new Error("Network error");
        parsed = await response.json();
      } else {
        const jsonString = await FileSystem.readAsStringAsync(uri);
        parsed = JSON.parse(jsonString);
      }

      const items = parsed.items || [];
      if (items.length > 0) {
        setFlashcards(items);
        if (parsed.badge) setGameBadge(parsed.badge);
      } else {
        Alert.alert("Error", "No flashcards found in the file.");
        setFlashcards([]);
      }
    } catch (err) {
      console.error("Failed to load flashcard JSON:", err);
      Alert.alert("Error", "Unable to load flashcard file.");
      setFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const handleKnow = () => {
    setKnowCount(prev => prev + 1);
    nextCard();
  };

  const handleNotKnow = () => {
    setNotKnowCount(prev => prev + 1);
    nextCard();
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      // Reset flip animation for next card
      setIsFlipped(false);
      flipAnim.setValue(0);
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Last card swiped
      if (gameBadge) {
        setShowBadge(true);
      } else {
        Alert.alert(
          "Complete!",
          "You've reviewed all flashcards!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"]
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"]
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5],
    outputRange: [1, 1, 0]
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0.5, 0.5, 1],
    outputRange: [0, 1, 1]
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (flashcards.length === 0 && !isLoading) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No flashcards available.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={32} color="#333" marginLeft={25} />
        </TouchableOpacity>
        
        <Text style={styles.scoreText}>
          Not Know: {notKnowCount} | Know: {knowCount}
        </Text>

      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={flipCard}
          style={[styles.cardTouchable, { width: cardWidth, height: cardHeight }]}
        >

          <Animated.View
            style={[
              styles.card,
              styles.front,
              {
                opacity: frontOpacity,
                transform: [{ rotateY: frontInterpolate }]
              }
            ]}
          >
            <View style={styles.punchHole}>
              <Text style={styles.punchHoleText}>
                {currentCardIndex + 1}/{flashcards.length}
              </Text>
            </View>

            <Text style={styles.cardText}>{currentCard?.term || "No term available"}</Text>
            <Text style={styles.flipHint}>Tap to flip</Text>
          </Animated.View>



          <Animated.View
            style={[
              styles.card,
              styles.back,
              {
                opacity: backOpacity,
                transform: [{ rotateY: backInterpolate }]
              }
            ]}
          >
            <View style={styles.punchHole}>
              <Text style={styles.punchHoleText}>
                {currentCardIndex + 1}/{flashcards.length}
              </Text>
            </View>

            <Text style={styles.cardText}>{currentCard?.definition || "No definition available"}</Text>
            <Text style={styles.flipHint}>Tap to flip back</Text>
            
          </Animated.View>
        </TouchableOpacity>
      </View>


      <View style={styles.controls}>
        <TouchableOpacity style={styles.notKnowButton} onPress={handleNotKnow}>
          <Text style={styles.buttonText}>Don't Know</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.knowButton} onPress={handleKnow}>
          <Text style={styles.buttonText}>Know</Text>
        </TouchableOpacity>
      </View>

      <Spacer height={20} />

      <BadgeReward
        visible={showBadge}
        badge={gameBadge}
        onClose={async () => {
          if (gameBadge && content_id) {
            try {
              await saveAchievementAndUpdateContent(db, gameBadge, content_id);
            } catch (error) {
              console.error("Failed to save achievement:", error);
            }
          }
          setShowBadge(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#4facfe",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 10,
    paddingTop: 15,
    marginBottom: 10,
  },
  counter: {
    fontSize: 14,
    color: "#7f8c8d",
    fontStyle: "italic",
    position: "absolute",
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
    flex: 1,
    paddingRight: 35,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardTouchable: {
    position: "relative",
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backfaceVisibility: "hidden",
    position: "absolute",
    borderWidth: 3,
    shadowColor: "#00000007",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  front: {
    backgroundColor: "#ffffff",
    borderColor: "#4facfe",
  },
  back: {
    backgroundColor: "#fff3cd",
    borderColor: "#f39c12",
  },
  cardText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2c3e50",
    marginBottom: 20,
  },
  flipHint: {
    fontSize: 14,
    color: "#7f8c8d",
    fontStyle: "italic",
    position: "absolute",
    bottom: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  notKnowButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 20,
  },

  knowButton: {
    flex: 1,
    backgroundColor: "#2ecc71",
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  punchHole: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#303030ff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  punchHoleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2e3740ff",
  },
});
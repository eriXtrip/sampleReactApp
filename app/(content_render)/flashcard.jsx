import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Dimensions, Animated } from "react-native";
import Swiper from "react-native-deck-swiper";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import Spacer from "../../components/Spacer";
import { Ionicons } from "@expo/vector-icons";

export default function FlashCardScreen() {
  const { flashcardUri } = useLocalSearchParams() || {};
  const router = useRouter();
  const navigation = useNavigation();

  const [flashData, setFlashData] = useState([]);
  const [knowCount, setKnowCount] = useState(0);
  const [notKnowCount, setNotKnowCount] = useState(0);
  const flipAnimations = useRef([]).current; // one Animated.Value per card

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const cardWidth = screenWidth - 60;
  const cardHeight = screenHeight / 1.5;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!flashcardUri) {
      Alert.alert("Error", "Flashcard file not provided.");
      return;
    }

    const loadFlashcards = async () => {
      try {
        let parsed;
        if (flashcardUri.startsWith("http")) {
          const response = await fetch(flashcardUri);
          parsed = await response.json();
        } else {
          const jsonString = await FileSystem.readAsStringAsync(flashcardUri);
          parsed = JSON.parse(jsonString);
        }
        setFlashData(parsed.items || []);

        // initialize flip animation for each card
        parsed.items.forEach((_, index) => {
          flipAnimations[index] = new Animated.Value(0);
        });
      } catch (err) {
        console.error("Failed to load flashcard JSON:", err);
        Alert.alert("Error", "Unable to load flashcard file.");
      }
    };
    loadFlashcards();
  }, [flashcardUri]);

  const flipCard = (index) => {
    const animValue = flipAnimations[index];
    animValue.stopAnimation();
    animValue.setValue(animValue._value || 0); // ensure we start from current

    Animated.timing(animValue, {
      toValue: animValue._value >= 90 ? 0 : 180,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const onSwiped = (index, direction) => {
    if (direction === "right") setKnowCount((prev) => prev + 1);
    if (direction === "left") setNotKnowCount((prev) => prev + 1);

    // reset flip animation for recycled cards
    if (flipAnimations[index]) flipAnimations[index].setValue(0);

    if (index === flashData.length - 1) {
      Alert.alert(
        "Done!",
        `Know: ${knowCount + (direction === "right" ? 1 : 0)}\nNot Know: ${notKnowCount + (direction === "left" ? 1 : 0)}`,
        [{ text: "Close", onPress: () => router.back() }]
      );
    }
  };

  if (!flashData || flashData.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading flashcards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontWeight: "bold" }}>
         Not Know: {notKnowCount} |  Know: {knowCount} 
        </Text>
      </View>

      <View style={styles.swiperContainer}>
        <Swiper
            cards={flashData}
            cardIndex={0}
            renderCard={(card, index) => {
                const flipAnim = flipAnimations[index] || new Animated.Value(0);

                const frontRotate = flipAnim.interpolate({
                    inputRange: [0, 180],
                    outputRange: ["0deg", "180deg"],
                });
                const backRotate = flipAnim.interpolate({
                    inputRange: [0, 180],
                    outputRange: ["180deg", "360deg"],
                });

                return (
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => flipCard(index)}
                        style={{ width: cardWidth, height: cardHeight, alignSelf: 'center' }}
                    >
                        <View style={{ width: cardWidth, height: cardHeight }}>
                            {/* Front */}
                            <Animated.View
                            style={[
                                styles.card,
                                {
                                transform: [{ rotateY: frontRotate }],
                                backfaceVisibility: "hidden",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                },
                            ]}
                            >
                            <Text style={styles.cardText}>{card.term}</Text>
                            </Animated.View>

                            {/* Back */}
                            <Animated.View
                            style={[
                                styles.card,
                                {
                                transform: [{ rotateY: backRotate }],
                                backfaceVisibility: "hidden",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#f0f0f0",
                                },
                            ]}
                            >
                            <Text style={styles.cardText}>{card.definition}</Text>
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
                );
            }}
            onSwipedRight={(index) => onSwiped(index, "right")}
            onSwipedLeft={(index) => onSwiped(index, "left")}
            backgroundColor="transparent"
            stackSeparation={15}
            animateCardOpacity
            disableBottomSwipe
            disableTopSwipe
        />
      </View>
      <Spacer height={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  swiperContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  cardFace: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  cardText: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
});

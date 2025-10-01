import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Dimensions, Animated } from "react-native";
import Swiper from "react-native-deck-swiper";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import Spacer from "../../components/Spacer";
import { Ionicons } from "@expo/vector-icons";
import BadgeReward from "../../components/BadgeReward";
import LoadingAnimation from "../../components/loadingAnimation";
import { useSQLiteContext } from 'expo-sqlite';
import { saveAchievementAndUpdateContent } from "../../utils/achievementUtils";

export default function FlashCardScreen() {
  const { uri, content_id } = useLocalSearchParams();
  console.log("Flashcard Params:", { uri, content_id });
  const router = useRouter();
  const navigation = useNavigation();

  const db = useSQLiteContext();

  const [flashData, setFlashData] = useState([]);
  const [knowCount, setKnowCount] = useState(0);
  const [notKnowCount, setNotKnowCount] = useState(0);
  const [gameBadge, setGameBadge] = useState(null); // badge state
  const [showBadge, setShowBadge] = useState(false); // show modal

  const flipAnimations = useRef([]).current; // one Animated.Value per card

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const cardWidth = screenWidth - 60;
  const cardHeight = screenHeight / 1.5;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!uri) {
      Alert.alert("Error", "Flashcard file not provided.");
      return;
    }

    const loadFlashcards = async () => {
      try {
        let parsed;
        if (uri.startsWith("http")) {
          const response = await fetch(uri);
          parsed = await response.json();
        } else {
          const jsonString = await FileSystem.readAsStringAsync(uri);
          parsed = JSON.parse(jsonString);
        }
        setFlashData(parsed.items || []);

        // initialize flip animation for each card
        parsed.items.forEach((_, index) => {
          flipAnimations[index] = new Animated.Value(0);
        });

        // set badge if exists
        if (parsed.badge) {
          setGameBadge(parsed.badge);
        }
      } catch (err) {
        console.error("Failed to load flashcard JSON:", err);
        Alert.alert("Error", "Unable to load flashcard file.");
      }
    };
    loadFlashcards();
  }, [uri]);

  const flipCard = (index) => {
    const animValue = flipAnimations[index];
    animValue.stopAnimation();
    animValue.setValue(animValue._value || 0);

    Animated.timing(animValue, {
      toValue: animValue._value >= 90 ? 0 : 180,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const onSwiped = (index, direction) => {
    if (direction === "right") setKnowCount((prev) => prev + 1);
    if (direction === "left") setNotKnowCount((prev) => prev + 1);

    if (flipAnimations[index]) flipAnimations[index].setValue(0);

    // show badge after last card
    if (index === flashData.length - 1 && gameBadge) {
      setShowBadge(true);
    }
  };

  if (!flashData || flashData.length === 0) {
    return <LoadingAnimation />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontWeight: "bold" }}>
          Not Know: {notKnowCount} | Know: {knowCount}
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
                style={{ width: cardWidth, height: cardHeight, alignSelf: "center" }}
              >
                <View style={{ width: cardWidth, height: cardHeight }}>
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
                        borderColor: "#89d1dfff",
                        backgroundColor: "#ddf6fc91",
                      },
                    ]}
                  >
                    <Text style={styles.cardText}>{card.term}</Text>
                  </Animated.View>

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
                        borderColor: "#89d1dfff",
                        backgroundColor: "#ddf6fc91",
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

      {/* Badge Modal */}
      <BadgeReward
        visible={showBadge}
        badge={gameBadge}
        onClose={async () => {
          await saveAchievementAndUpdateContent(db, gameBadge, content_id);
          setShowBadge(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  swiperContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardText: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
});

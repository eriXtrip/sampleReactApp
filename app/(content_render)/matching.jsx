// app/(content_render)/matching.jsx

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Dimensions, Animated, Image } from "react-native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import Spacer from "../../components/Spacer";
import { Ionicons } from "@expo/vector-icons";
import BadgeReward from "../../components/BadgeReward";
import LoginLogo from "../../assets/img/Login_Logo.png";

export default function MatchingScreen() {
  const { uri } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const [matchingData, setMatchingData] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [gameBadge, setGameBadge] = useState(null); // badge state
  const [showBadge, setShowBadge] = useState(false); // show modal
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
  const [showNextBatchMessage, setShowNextBatchMessage] = useState(false);

  const animations = useRef({});
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const theme = { cardBorder: "#92cbd6ff", text: "#333", background: "#ddf6fc91" };
  const batchSize = 6;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const loadMatching = async () => {
      try {
        let parsed;
        if (uri.startsWith("http")) {
          const response = await fetch(uri);
          parsed = await response.json();
        } else {
          const jsonString = await FileSystem.readAsStringAsync(uri);
          parsed = JSON.parse(jsonString);
        }

        setMatchingData(parsed);
        if (parsed.badge) setGameBadge(parsed.badge);

        // Start timer
        const now = Date.now();
        setStartTime(now);
        timerRef.current = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - now) / 1000));
        }, 1000);

      } catch (err) {
        console.error("Failed to load matching JSON:", err);
        Alert.alert("Error", "Unable to load matching file.");
      }
    };

    loadMatching();

    return () => clearInterval(timerRef.current);
  }, [uri]);

  useEffect(() => {
    if (!matchingData) return;

    const start = batchIndex * batchSize;
    const end = start + batchSize;
    const batchItems = matchingData.items.slice(start, end);

    // Create cards for this batch
    let _cards = [];
    batchItems.forEach(item => {
      _cards.push({ id: item.id, type: "term", content: item.term, key: `${item.id}-term` });
      _cards.push({ id: item.id, type: "definition", content: item.definition, key: `${item.id}-definition` });
    });

    _cards = shuffleArray(_cards);
    setCards(_cards);
    setMatchedIds([]);
    setSelectedCards([]);

    // Initialize animations
    _cards.forEach(c => animations.current[c.key] = new Animated.Value(0));
  }, [batchIndex, matchingData]);

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const flipCard = (key, toValue) => {
    Animated.timing(animations.current[key], {
      toValue,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleNextBatchAnimation = () => {
    // Pause timer
    clearInterval(timerRef.current);

    setShowNextBatchMessage(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      setShowNextBatchMessage(false);
      setBatchIndex(batchIndex + 1);

      // Resume timer
      const now = Date.now() - elapsedTime * 1000;
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - now) / 1000));
      }, 1000);
    });
  };

  const handleSelectCard = (card) => {
    if (selectedCards.find((c) => c.key === card.key) || matchedIds.includes(card.id)) return;

    flipCard(card.key, 180);
    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);

    if (newSelection.length === 2) {
      const [first, second] = newSelection;
      if (first.id === second.id && first.type !== second.type) {
        // Correct pair
        setMatchedIds([...matchedIds, first.id]);
        setSelectedCards([]);

        const currentBatchSize = Math.min(batchSize, matchingData.items.length - batchIndex * batchSize);

        if (matchedIds.length + 1 === currentBatchSize) {
          // Check if more batches remain
          if ((batchIndex + 1) * batchSize < matchingData.items.length) {
            handleNextBatchAnimation();
          } else {
            clearInterval(timerRef.current);
            setTimeout(() => setShowBadge(true), 500);
          }
        }
      } else {
        // Wrong pair
        setTimeout(() => {
          flipCard(first.key, 0);
          flipCard(second.key, 0);
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  if (!matchingData) return (
    <View style={styles.container}>
      <Text>Loading matching game...</Text>
    </View>
  );

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const cardWidth = (screenWidth - 55) / 3;
  const cardHeight = (screenHeight - 90) / 4;

  const rows = [];
  const numColumns = 3;
  for (let i = 0; i < cards.length; i += numColumns) rows.push(cards.slice(i, i + numColumns));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.timerText}>⏱ {elapsedTime}s</Text>
      </View>

      {showNextBatchMessage && (
        <Animated.View style={[styles.nextBatchMessage, { opacity: fadeAnim }]}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#fff" }}>
            Next Batch – You Can Do It! 💪
          </Text>
        </Animated.View>
      )}

      <View style={{ alignItems: "center", marginTop: 5 }}>
        {rows.map((rowCards, rowIndex) => (
          <View key={`row-${rowIndex}`} style={{ flexDirection: "row", marginBottom: 8 }}>
            {rowCards.map((card) => {
              const animatedValue = animations.current[card.key];
              const frontInterpolate = animatedValue.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
              const backInterpolate = animatedValue.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });
              const isMatched = matchedIds.includes(card.id);
              const opacity = isMatched ? 0 : 1;

              return (
                <TouchableOpacity
                  key={card.key}
                  onPress={() => handleSelectCard(card)}
                  activeOpacity={1}
                  disabled={isMatched}
                  style={{ marginHorizontal: 5, width: cardWidth, height: cardHeight }}
                >
                  <Animated.View
                    style={[styles.card, { width: cardWidth, height: cardHeight, opacity, transform: [{ rotateY: frontInterpolate }], backgroundColor: "#b0bcbf5f", borderColor: "#9eb4b8ff" }]}
                  >
                      <Image
                      source={LoginLogo} // use the imported local image
                      style={{
                        width: "90%",
                        height: "55%",
                        resizeMode: "cover",
                        opacity: 0.3, // optional: blend with card back
                      }}
                    />
                  </Animated.View>
                  <Animated.View
                    style={[styles.card, { width: cardWidth, height: cardHeight, position: "absolute", top: 0, backfaceVisibility: "hidden", transform: [{ rotateY: backInterpolate }], backgroundColor: "#ddf6fc91", borderColor: "#89d1dfff" }]}
                  >
                    <Text style={{ textAlign: "center", fontWeight: "bold" }}>{card.content}</Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      <Spacer height={40} />

      {/* Badge Modal */}
      <BadgeReward
        visible={showBadge}
        badge={gameBadge}
        onClose={() => {
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
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 10,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backfaceVisibility: "hidden",
  },
  resultText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 8,
  },
  closeText: {
    color: "#fff",
    textAlign: "center",
  },
  nextBatchMessage: {
    width: "100%",
    height: "80%",
    backgroundColor: "#96c0c8ff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
});

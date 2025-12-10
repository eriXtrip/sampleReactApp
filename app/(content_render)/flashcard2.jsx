// FlashCardScreen.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import LoadingAnimation from "../../components/loadingAnimation";
import BadgeReward from "../../components/BadgeReward";
import FlashCard from "../../components/FlashCard"; // ← Import here
import Spacer from "../../components/Spacer";
import { useSQLiteContext } from 'expo-sqlite';
import { saveAchievementAndUpdateContent } from "../../utils/achievementUtils";
import { usePreventScreenCapture } from "expo-screen-capture";

export default function FlashCardScreen() {
  const { uri, content_id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const {db, inizialized} = useSQLiteContext();

  usePreventScreenCapture();

  const [flashData, setFlashData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knowCount, setKnowCount] = useState(0);
  const [notKnowCount, setNotKnowCount] = useState(0);
  const [gameBadge, setGameBadge] = useState(null);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    if (!uri) return;

    const load = async () => {
      try {
        let parsed;
        if (uri.startsWith("http")) {
          const res = await fetch(uri);
          parsed = await res.json();
        } else {
          const json = await FileSystem.readAsStringAsync(uri);
          parsed = JSON.parse(json);
        }
        setFlashData(parsed.items || []);
        if (parsed.badge) setGameBadge(parsed.badge);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [uri]);

  const handleSwipeLeft = () => {
    setNotKnowCount(c => c + 1);
    nextCard();
  };

  const handleSwipeRight = () => {
    setKnowCount(c => c + 1);
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex >= flashData.length - 1) {
      if (gameBadge) setShowBadge(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  if (flashData.length === 0) return <LoadingAnimation />;

  const currentCard = flashData[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={30} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          {currentIndex + 1} / {flashData.length}  •  Know: {knowCount}  •  Not: {notKnowCount}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {flashData.length > 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <FlashCard
            term={flashData[currentIndex].term}
            definition={flashData[currentIndex].definition}
            onSwipeLeft={() => {
              setNotKnowCount(c => c + 1);
              if (currentIndex === flashData.length - 1) {
                if (gameBadge) setShowBadge(true);
              } else {
                setCurrentIndex(i => i + 1);
              }
            }}
            onSwipeRight={() => {
              setKnowCount(c => c + 1);
              if (currentIndex === flashData.length - 1) {
                if (gameBadge) setShowBadge(true);
              } else {
                setCurrentIndex(i => i + 1);
              }
            }}
          />
        </View>
      ) : (
        <LoadingAnimation />
      )}

      <Spacer height={20} />

      <BadgeReward
        visible={showBadge}
        badge={gameBadge}
        onClose={async () => {
          if (gameBadge) {
            await saveAchievementAndUpdateContent(db, gameBadge, content_id, inizialized);
          }
          setShowBadge(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  counter: { fontWeight: "bold", fontSize: 16 },
  progress: { fontSize: 16, color: "#666" },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
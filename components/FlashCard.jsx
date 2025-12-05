import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

export default function FlashCard({ term, definition, onSwipeLeft, onSwipeRight }) {
  const rotateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const flip = () => {
    rotateY.value = withTiming(rotateY.value === 0 ? 180 : 0, { duration: 600 });
  };

  const completeSwipe = (direction) => {
    if (direction === 'left') onSwipeLeft?.();
    if (direction === 'right') onSwipeRight?.();
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      opacity.value = 1 - Math.abs(e.translationX) / 400;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 100) {
        const dir = e.translationX > 0 ? 'right' : 'left';
        translateX.value = withSpring(width * 2 * (dir === 'right' ? 1 : -1));
        opacity.value = withSpring(0);
        runOnJS(completeSwipe)(dir);
      } else {
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const fling = Gesture.Fling()
    .direction(Directions.LEFT | Directions.RIGHT)
    .onEnd((e) => {
      const dir = e.translationX > 0 ? 'right' : 'left';
      translateX.value = withSpring(width * 2 * (dir === 'right' ? 1 : -1));
      opacity.value = withSpring(0);
      runOnJS(completeSwipe)(dir);
    });

  const gesture = Gesture.Simultaneous(pan, fling);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  const frontStyle = useAnimatedStyle(() => ({ opacity: rotateY.value <= 90 ? 1 : 0 }));
  const backStyle = useAnimatedStyle(() => ({ opacity: rotateY.value >= 90 ? 1 : 0 }));

  return (
    <GestureDetector gesture={gesture}>
      <TouchableWithoutFeedback onPress={flip}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Animated.View style={[styles.face, styles.front, frontStyle]}>
            <Text style={styles.text}>{term}</Text>
          </Animated.View>
          <Animated.View style={[styles.face, styles.back, backStyle]}>
            <Text style={styles.text}>{definition}</Text>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  front: { backgroundColor: '#4facfe' },
  back: {
    backgroundColor: '#ff6b6b',
    transform: [{ rotateY: '180deg' }],
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});
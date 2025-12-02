import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Confetti from './Confetti';

const SummaryBox = ({ passed = false, score = 0, maxScore = 100, children }) => {
  const confettiRef = useRef(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (passed) {
      // play confetti and fade in overlay
      try { confettiRef.current?.play?.(); } catch (e) {}
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [passed]);

  return (
    <View style={[styles.container, passed ? styles.pass : styles.fail]}>
      {/* Confetti sits behind overlay when passed */}
      {passed && (
        <Confetti
          ref={confettiRef}
          style={styles.confettiOverride}
        />
      )}

      <View style={styles.contentRow}>
        <View style={styles.leftColumn}>
          <Text style={[styles.statusText, passed ? styles.statusPassText : styles.statusFailText]}>{passed ? 'Passed' : 'Failed'}</Text>
          <Text style={styles.detailText}>Score: {score} / {maxScore}</Text>
        </View>
        <View style={styles.rightColumn}>
          {/* show a simple badge */}
          <View style={[styles.badge, passed ? styles.badgePass : styles.badgeFail]}>
            <Text style={styles.badgeText}>{passed ? '✓' : '✕'}</Text>
          </View>
        </View>
      </View>

      {/* Congratulation overlay */}
      {passed && (
        <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: fade }]}>
          <View style={styles.overlayInner}>
            <Text style={styles.overlayTitle}>Congratulations!</Text>
            <Text style={styles.overlaySub}>Keep it up — you're doing great. You can do it!</Text>
          </View>
        </Animated.View>
      )}

      {/* children (e.g. extra info) */}
      {!!children && <View style={styles.childrenWrap}>{children}</View>}
    </View>
  );
};

export default SummaryBox;

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  pass: {
    backgroundColor: '#e6fbef',
    borderWidth: 1,
    borderColor: '#26a65b44',
  },
  fail: {
    backgroundColor: '#f1f1f2',
    borderWidth: 1,
    borderColor: '#c4c4c4',
  },
  contentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftColumn: { flex: 1 },
  rightColumn: { width: 52, alignItems: 'center' },
  statusText: { fontSize: 18, fontWeight: '800' },
  statusPassText: { color: '#047857' },
  statusFailText: { color: '#6b7280' },
  detailText: { marginTop: 6, color: '#374151' },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  badgePass: { backgroundColor: '#10b98122', borderColor: '#10b981' },
  badgeFail: { backgroundColor: '#9ca3af22', borderColor: '#6b7280' },
  badgeText: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)'
  },
  overlayInner: { padding: 18, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', width: '86%' },
  overlayTitle: { fontSize: 18, fontWeight: '800', color: '#065f46', marginBottom: 6 },
  overlaySub: { fontSize: 13, color: '#065f46', textAlign: 'center' },
  confettiOverride: { position: 'absolute', top: -30, left: -20, width: '140%', height: 180, zIndex: 0, opacity: 0.95 },
  childrenWrap: { marginTop: 8 }
});

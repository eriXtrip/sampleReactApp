import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function NavButtons({ showPrev, showNext, isLast, onPrev, onNext }) {
  return (
    <View style={styles.navRow}>
      {showPrev && (
        <TouchableOpacity style={[styles.navButton, { width: "48%" }]} onPress={onPrev}>
          <Text style={styles.navText}>Prev</Text>
        </TouchableOpacity>
      )}

      {showNext && (
        <TouchableOpacity style={[styles.navButton, showPrev ? { width: "48%" } : { width: "100%" }]} onPress={onNext}>
          <Text style={styles.navText}>{isLast ? "Finish" : "Next"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: "auto",
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: "#48cae4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  navText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

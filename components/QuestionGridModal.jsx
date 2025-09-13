// components/QuestionGridModal.jsx
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const QuestionGridModal = ({
  visible,
  onClose,
  questions,
  answers,
  currentQuestion,
  setCurrentQuestion,
  quizData,
  theme,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Jump to Question</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Question grid */}
          <View style={styles.gridWrapper}>
            {questions.map((item, index) => {
              const isAnswered = answers[item.id];
              const isClickable =
                !quizData.settings.instantFeedback &&
                (quizData.settings.allowBack || index === currentQuestion);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.gridItem,
                    {
                      borderColor: isAnswered ? "#48cae4" : theme.cardBorder,
                    },
                    !isClickable && { opacity: 0.4 },
                  ]}
                  disabled={!isClickable}
                  onPress={() => {
                    if (isClickable) {
                      setCurrentQuestion(index);
                      onClose();
                    }
                  }}
                >
                  <Text>{index + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  gridItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default QuestionGridModal;

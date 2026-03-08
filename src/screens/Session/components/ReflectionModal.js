/**
 * ReflectionModal - Session reflection/rating modal
 */
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { styles, colors } from "./styles";

export default function ReflectionModal({
  visible,
  rating,
  setRating,
  fatigueInput,
  setFatigueInput,
  extended,
  reflection,
  setReflection,
  submitting,
  onSkip,
  onExtend,
  onSubmit,
  onEndPractice,
  isLastItem,
}) {
  const renderRatingRow = () => (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((r) => (
        <TouchableOpacity
          key={r}
          onPress={() => setRating(r)}
          style={[
            styles.ratingButton,
            rating === r && styles.ratingButtonSelected,
          ]}
        >
          <Text
            style={[
              styles.ratingButtonText,
              rating === r && styles.ratingButtonTextSelected,
            ]}
          >
            {r}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>How did it go?</Text>

          <Text style={styles.modalSubtitle}>
            Rate your practice (1 = struggled, 5 = nailed it)
          </Text>

          {renderRatingRow()}

          <Text style={styles.helperText}>How are you feeling? (Optional)</Text>

          <View style={styles.fatigueRow}>
            {["😫", "😐", "😊", "🔥"].map((emoji, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setFatigueInput(idx)}
                style={[
                  styles.fatigueButton,
                  fatigueInput === idx && styles.fatigueButtonSelected,
                ]}
              >
                <Text style={styles.fatigueEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {extended && (
            <TextInput
              style={styles.textInput}
              placeholder="Notes (optional)..."
              placeholderTextColor="#666"
              value={reflection}
              onChangeText={setReflection}
              multiline
            />
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            {!extended && (
              <TouchableOpacity style={styles.extendButton} onPress={onExtend}>
                <Text style={styles.extendButtonText}>+ Notes</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || !rating) && styles.submitButtonDisabled,
              ]}
              onPress={onSubmit}
              disabled={submitting || !rating}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.textDark} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLastItem ? "Finish" : "Submit"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* End Practice option - shown when not on last item */}
          {!isLastItem && onEndPractice && (
            <TouchableOpacity
              style={styles.endPracticeLink}
              onPress={onEndPractice}
            >
              <Text style={styles.endPracticeLinkText}>
                End Practice & Go Home
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

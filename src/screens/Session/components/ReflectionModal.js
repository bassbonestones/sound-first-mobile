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
}) {
  const renderRatingRow = () => (
    <View
      style={{
        flexDirection: "row",
        marginVertical: 12,
        justifyContent: "space-around",
        width: "100%",
      }}
    >
      {[1, 2, 3, 4, 5].map((r) => (
        <TouchableOpacity
          key={r}
          onPress={() => setRating(r)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: rating === r ? "#FFD700" : "#333",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: rating === r ? "#FFD700" : "#555",
          }}
        >
          <Text
            style={{
              color: rating === r ? "#1a1a2e" : "#aaa",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            {r}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#2a2a4a",
            borderRadius: 18,
            padding: 24,
            width: "100%",
            maxWidth: 360,
            borderWidth: 2,
            borderColor: "#FFD700",
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 22,
              fontWeight: "bold",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            How did it go?
          </Text>

          <Text
            style={{
              color: "#ddd",
              fontSize: 14,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Rate your practice (1 = struggled, 5 = nailed it)
          </Text>

          {renderRatingRow()}

          <Text
            style={{
              color: "#888",
              fontSize: 13,
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            How are you feeling? (Optional)
          </Text>

          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            {["😫", "😐", "😊", "🔥"].map((emoji, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setFatigueInput(idx)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor:
                    fatigueInput === idx ? "#333" : "transparent",
                  alignItems: "center",
                  borderWidth: fatigueInput === idx ? 1 : 0,
                  borderColor: "#FFD700",
                }}
              >
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {extended && (
            <TextInput
              style={{
                backgroundColor: "#1a1a2e",
                borderRadius: 8,
                color: "#fff",
                padding: 12,
                minHeight: 80,
                textAlignVertical: "top",
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#444",
              }}
              placeholder="Notes (optional)..."
              placeholderTextColor="#666"
              value={reflection}
              onChangeText={setReflection}
              multiline
            />
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#333",
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
                marginRight: 8,
              }}
              onPress={onSkip}
            >
              <Text style={{ color: "#888", fontSize: 14 }}>Skip</Text>
            </TouchableOpacity>

            {!extended && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#4a4a6a",
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: "center",
                  marginHorizontal: 8,
                }}
                onPress={onExtend}
              >
                <Text style={{ color: "#ddd", fontSize: 14 }}>+ Notes</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                flex: 1.5,
                backgroundColor: submitting ? "#888" : "#FFD700",
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
                marginLeft: 8,
                opacity: !rating ? 0.5 : 1,
              }}
              onPress={onSubmit}
              disabled={submitting || !rating}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#1a1a2e" />
              ) : (
                <Text
                  style={{
                    color: "#1a1a2e",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

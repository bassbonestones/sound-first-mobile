/**
 * Starting Note Selection Step (Step 2)
 *
 * User selects their starting note via staff picker or microphone detection.
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import StaffNotePicker from "../../../components/StaffNotePicker";
import AudioInput from "../../../components/AudioInput";
import ResetButton from "../../../components/ResetButton";
import { createShadow } from "../../../styles/theme";
import ProgressDots from "../components/ProgressDots";

/**
 * Play-to-Select Mode - Microphone pitch detection
 */
function PlayToSelectMode({
  instrumentIcon,
  detectedPitch,
  isSounding,
  onRealtimePitch,
  onFinalPitch,
  onSoundEnd,
  onConfirm,
  onBack,
}) {
  const canConfirm = !!detectedPitch;

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          padding: 24,
          paddingBottom: 180,
          paddingTop: 60,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{ position: "absolute", top: 50, left: 20 }}
        >
          <Text style={{ color: "#FFD700", fontSize: 16 }}>
            ← Back to staff
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 36, marginBottom: 8 }}>{instrumentIcon}</Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#FFD700",
            marginBottom: 8,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            textAlign: "center",
          }}
        >
          Play a note that feels great
        </Text>
        <Text
          style={{
            color: "#e6cfa7",
            fontSize: 16,
            marginBottom: 24,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            textAlign: "center",
            paddingHorizontal: 20,
          }}
        >
          Play around on your instrument and find a note that feels natural,
          resonant, and easy to play. When you find it, hold it steady.
        </Text>

        <AudioInput
          enabled={true}
          onRealtimePitch={onRealtimePitch}
          onPitchDetected={onFinalPitch}
          onSoundEnd={onSoundEnd}
          showDebug={false}
          volumeThreshold={0.2}
        />

        {detectedPitch && (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <Text style={{ color: "#e6cfa7", fontSize: 16, marginBottom: 8 }}>
              {isSounding ? "I hear:" : "Detected:"}
            </Text>
            <View
              style={{
                backgroundColor: !isSounding
                  ? "#4a2d5a"
                  : detectedPitch.isInTune
                    ? "#2d5a2d"
                    : "#3b2c1a",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderWidth: 2,
                borderColor: "#FFD700",
                minHeight: 90,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFD700",
                  fontSize: 32,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {detectedPitch.noteName}
              </Text>
              <Text
                style={{
                  color: "#e6cfa7",
                  fontSize: 14,
                  textAlign: "center",
                  marginTop: 4,
                  minHeight: 18,
                }}
              >
                {detectedPitch.isRealtime
                  ? detectedPitch.isInTune
                    ? "In tune ✓"
                    : `${detectedPitch.cents > 0 ? "+" : ""}${detectedPitch.cents} cents`
                  : " "}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom area with button and progress dots */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          paddingBottom: 40,
          alignItems: "center",
          backgroundColor: "#1a1410",
        }}
      >
        <TouchableOpacity
          disabled={!canConfirm}
          onPress={onConfirm}
          style={{
            backgroundColor: canConfirm ? "#FFD700" : "#5a4a2a",
            borderRadius: 28,
            paddingVertical: 16,
            paddingHorizontal: 32,
            opacity: canConfirm ? 1 : 0.5,
          }}
        >
          <Text
            style={{
              color: canConfirm ? "#3b2c1a" : "#8a7a5a",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            Yes, that's my note! ✓
          </Text>
        </TouchableOpacity>

        <ProgressDots currentStep={2} />
      </View>
      <ResetButton />
    </View>
  );
}

/**
 * Staff-based Note Selection Mode
 */
function StaffSelectMode({
  instrumentIcon,
  instrument,
  clef,
  startingNote,
  onChangeNote,
  onPlayToSelect,
  onBack,
  onSubmit,
}) {
  const canProceed = !!startingNote;

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          padding: 24,
          paddingBottom: 180,
          paddingTop: 60,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{ position: "absolute", top: 50, left: 20 }}
        >
          <Text style={{ color: "#FFD700", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 36, marginBottom: 8 }}>{instrumentIcon}</Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#FFD700",
            marginBottom: 8,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            textAlign: "center",
          }}
        >
          Choose your starting note
        </Text>
        <Text
          style={{
            color: "#e6cfa7",
            fontSize: 16,
            marginBottom: 24,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            textAlign: "center",
            paddingHorizontal: 20,
          }}
        >
          Pick a note that feels great, resonant, and easy to play. This will be
          your home base.
        </Text>

        <StaffNotePicker
          clef={clef}
          value={startingNote}
          onChange={onChangeNote}
          onPlayToSelect={onPlayToSelect}
          instrument={instrument}
        />

        <Text
          style={{
            color: "#bfa76a",
            fontSize: 14,
            textAlign: "center",
            marginTop: 16,
            paddingHorizontal: 20,
          }}
        >
          Don't worry about picking the "perfect" note — you can always change
          it later!
        </Text>
      </ScrollView>

      {/* Fixed bottom area with button and progress dots */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          paddingBottom: 40,
          alignItems: "center",
          backgroundColor: "#1a1410",
        }}
      >
        <TouchableOpacity
          disabled={!canProceed}
          onPress={onSubmit}
          style={{
            backgroundColor: canProceed ? "#FFD700" : "#5a4a2a",
            borderRadius: 28,
            paddingVertical: 16,
            paddingHorizontal: 48,
            opacity: canProceed ? 1 : 0.5,
            ...createShadow(
              canProceed ? "#FFD700" : "#000",
              0,
              4,
              canProceed ? 0.4 : 0,
              12,
            ),
          }}
        >
          <Text
            style={{
              color: canProceed ? "#3b2c1a" : "#8a7a5a",
              fontWeight: "bold",
              fontSize: 20,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            Start Practicing 🎵
          </Text>
        </TouchableOpacity>

        <ProgressDots currentStep={2} />
      </View>
      <ResetButton />
    </View>
  );
}

/**
 * Starting Note Step - Main Component
 */
export default function StartingNoteStep({
  instrument,
  instrumentIcon,
  clef,
  startingNote,
  playToSelectMode,
  detectedPitch,
  isSounding,
  onChangeNote,
  onRealtimePitch,
  onFinalPitch,
  onSoundEnd,
  onConfirmPitch,
  onSetPlayToSelectMode,
  onBack,
  onSubmit,
}) {
  if (playToSelectMode) {
    return (
      <PlayToSelectMode
        instrumentIcon={instrumentIcon}
        detectedPitch={detectedPitch}
        isSounding={isSounding}
        onRealtimePitch={onRealtimePitch}
        onFinalPitch={onFinalPitch}
        onSoundEnd={onSoundEnd}
        onConfirm={onConfirmPitch}
        onBack={() => onSetPlayToSelectMode(false)}
      />
    );
  }

  return (
    <StaffSelectMode
      instrumentIcon={instrumentIcon}
      instrument={instrument}
      clef={clef}
      startingNote={startingNote}
      onChangeNote={onChangeNote}
      onPlayToSelect={() => onSetPlayToSelectMode(true)}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
}

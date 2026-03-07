import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { getBackendUrl } from "../../../api/client";
import { useFirstNote } from "../context/FirstNoteContext";

/**
 * Dev Navigation Menu for testing - jump to any stage/substep
 * Shows a floating button that opens a menu overlay with stage navigation
 */
export function DevNavMenu() {
  const {
    stage,
    setStage,
    setSubStep,
    setFocusCardIndex,
    setFocusStepsDone,
    setFocusCardRatings,
    setPitchAccuracy,
    userId,
    navigation,
  } = useFirstNote();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const performReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`${getBackendUrl()}/users/${userId}/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Onboarding" }],
        }),
      );
    } catch (err) {
      console.error("Reset error:", err);
      if (Platform.OS === "web") {
        alert("Failed to reset: " + err.message);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Reset all progress and start over?")) {
        performReset();
      }
    }
  };

  const STAGE_TREE = [
    {
      id: -1,
      name: "Settings",
      isSettings: true,
      subSteps: [
        {
          id: 0,
          name: "a) Instrument Class",
          screen: "Onboarding",
          params: { step: 1, clearFamily: true },
        },
        {
          id: 1,
          name: "b) Instrument",
          screen: "Onboarding",
          params: { step: 1 },
        },
        {
          id: 2,
          name: "c) First Note Picker",
          screen: "Onboarding",
          params: { step: 2 },
        },
      ],
    },
    {
      id: 0,
      name: "Listen & Sing",
      subSteps: [
        { id: 0, name: "a) Listen" },
        { id: 1, name: "b) Sing" },
        { id: 2, name: "c) Imagine" },
      ],
    },
    {
      id: 1,
      name: "Play Your Note",
      subSteps: [
        { id: 0, name: "a) Imagine intro" },
        { id: 1, name: "b) Ready to play" },
        { id: 2, name: "c) Playing" },
        { id: 3, name: "d) Rating" },
      ],
    },
    {
      id: 2,
      name: "Refine Your Sound",
      subSteps: [
        { id: 0, name: "a) Focus Card 1/3", focusCardIndex: 0 },
        { id: 1, name: "b) Focus Card 2/3", focusCardIndex: 1 },
        { id: 2, name: "c) Focus Card 3/3", focusCardIndex: 2 },
        {
          id: 3,
          name: "d) All Complete",
          focusCardIndex: 0,
          ratings: [4, 4, 4],
        },
      ],
    },
    {
      id: 3,
      name: "The Musical Staff",
      subSteps: [
        { id: 0, name: "a) Staff intro" },
        { id: 1, name: "b) Fun fact" },
        { id: 2, name: "c) Ledger lines" },
      ],
    },
    {
      id: 4,
      name: "What is a Note?",
      subSteps: [
        { id: 0, name: "a) Note head" },
        { id: 1, name: "b) Note on line" },
        { id: 2, name: "c) Note in space" },
        { id: 3, name: "d) Explore pitch" },
      ],
    },
    {
      id: 5,
      name: "Your Clef",
      subSteps: [
        { id: 0, name: "a) Clef intro" },
        { id: 1, name: "b) Clef details" },
      ],
    },
    {
      id: 6,
      name: "Sharps & Flats",
      subSteps: [
        { id: 0, name: "a) Symbols" },
        { id: 1, name: "b) Naturals default" },
        { id: 2, name: "c) Try accidentals" },
        { id: 3, name: "d) Combined explorer" },
        { id: 4, name: "e) Your note" },
      ],
    },
    {
      id: 7,
      name: "Note on Staff",
      subSteps: [],
    },
  ];

  const navigateTo = (stageId, subStepData) => {
    // Handle Settings items - navigate to Onboarding screen
    if (subStepData.screen) {
      setIsOpen(false);
      setExpandedStage(null);
      navigation.replace(subStepData.screen, subStepData.params || {});
      return;
    }

    // Reset common state
    setPitchAccuracy(null);
    setFocusStepsDone({
      listen: false,
      sing: false,
      imagine: false,
      play: false,
    });

    // Handle Stage 2 (Focus Cards) specially
    if (stageId === 2) {
      if (subStepData.ratings) {
        // Jump to "All Complete" state
        setFocusCardRatings(subStepData.ratings);
        setFocusCardIndex(0);
      } else {
        setFocusCardIndex(subStepData.focusCardIndex || 0);
        setFocusCardRatings([]);
      }
      setSubStep(0);
    } else {
      // Regular stage navigation
      setFocusCardIndex(0);
      setFocusCardRatings([]);
      setSubStep(subStepData.id);
    }

    setStage(stageId);
    setIsOpen(false);
    setExpandedStage(null);
  };

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.menuButtonText}>🔧</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.menuOverlay}>
      <View style={styles.menuContainer}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Dev Navigation</Text>
          <TouchableOpacity
            onPress={() => {
              setIsOpen(false);
              setExpandedStage(null);
            }}
          >
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menuScroll}>
          {STAGE_TREE.map((stageItem) => (
            <View key={stageItem.id}>
              <TouchableOpacity
                style={[
                  styles.stageRow,
                  stageItem.isSettings && styles.settingsRow,
                  stage === stageItem.id &&
                    !stageItem.isSettings &&
                    styles.stageRowActive,
                ]}
                onPress={() => {
                  if (stageItem.subSteps.length === 0) {
                    navigateTo(stageItem.id, { id: 0 });
                  } else {
                    setExpandedStage(
                      expandedStage === stageItem.id ? null : stageItem.id,
                    );
                  }
                }}
              >
                <Text style={styles.stageIcon}>
                  {stageItem.subSteps.length > 0
                    ? expandedStage === stageItem.id
                      ? "▼"
                      : "▶"
                    : "•"}
                </Text>
                <Text
                  style={[
                    styles.stageName,
                    stageItem.isSettings && styles.settingsName,
                    stage === stageItem.id &&
                      !stageItem.isSettings &&
                      styles.stageNameActive,
                  ]}
                >
                  {stageItem.isSettings
                    ? `⚙️ ${stageItem.name}`
                    : `${stageItem.id}: ${stageItem.name}`}
                </Text>
              </TouchableOpacity>

              {expandedStage === stageItem.id &&
                stageItem.subSteps.map((subStep) => (
                  <TouchableOpacity
                    key={subStep.id}
                    style={[
                      styles.subStepRow,
                      stageItem.isSettings && styles.settingsSubStep,
                    ]}
                    onPress={() => navigateTo(stageItem.id, subStep)}
                  >
                    <Text style={styles.subStepName}>└ {subStep.name}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.resetButton, isResetting && { opacity: 0.6 }]}
          onPress={handleReset}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? "Resetting..." : "🔄 Reset User Data"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resetButton,
            { backgroundColor: "#3b2c1a", marginTop: 8 },
          ]}
          onPress={() => {
            setIsOpen(false);
            navigation.navigate("Admin");
          }}
        >
          <Text style={styles.resetButtonText}>⚙️ Admin Panel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
    zIndex: 1000,
  },
  menuButtonText: {
    fontSize: 24,
  },
  menuOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  menuContainer: {
    backgroundColor: "#1a1410",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderBottomWidth: 0,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
  },
  closeButton: {
    fontSize: 20,
    color: "#FFD700",
    padding: 5,
  },
  menuScroll: {
    maxHeight: 350,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a1f15",
  },
  stageRowActive: {
    backgroundColor: "#2a1f15",
  },
  stageIcon: {
    fontSize: 12,
    color: "#FFD700",
    width: 20,
  },
  stageName: {
    fontSize: 16,
    color: "#fffbe6",
  },
  stageNameActive: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  subStepRow: {
    paddingVertical: 10,
    paddingLeft: 40,
    paddingRight: 16,
    backgroundColor: "#0d0a07",
  },
  subStepName: {
    fontSize: 14,
    color: "#a09080",
  },
  resetButton: {
    margin: 16,
    padding: 12,
    backgroundColor: "#8B0000",
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  settingsRow: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    backgroundColor: "#1a1410",
  },
  settingsName: {
    color: "#a09080",
    fontSize: 14,
  },
  settingsSubStep: {
    backgroundColor: "#151210",
  },
});

export default DevNavMenu;

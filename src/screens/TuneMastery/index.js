/**
 * TuneMasteryScreen - Standalone practice tool for building tune fluency
 *
 * Features:
 * - Manage tunes with priority ordering
 * - Practice all 12 keys using EMA scoring
 * - Alternating learning/reinforcement selection algorithm
 * - Integrated tuner, metronome, and pitch drone
 */
import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useTuneMasteryData, ALL_KEYS } from "../../hooks/useTuneMasteryData";
import { useSelectionEngine } from "../../hooks/useSelectionEngine";
import TuneList from "./components/TuneList";
import SelectionPanel from "./components/SelectionPanel";
import PracticePanel from "./components/PracticePanel";
import SettingsModal from "./components/SettingsModal";
import styles from "./styles";

export default function TuneMasteryScreen({ navigation }) {
  const {
    data,
    loading,
    error,
    addTune,
    archiveTune,
    restoreTune,
    deleteTune,
    reorderTune,
    renameTune,
    updateTuneSettings,
    updateScore,
    updateSettings,
    setCurrentSession,
    clearCurrentSession,
    toggleLastPickType,
    seedTunes,
  } = useTuneMasteryData();

  const { getNextPick, getTuneName, isLearningPick, stats, MASTERY_THRESHOLD } =
    useSelectionEngine(data);

  // UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [newTuneName, setNewTuneName] = useState("");
  const [selectedTuneId, setSelectedTuneId] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isAddingTune, setIsAddingTune] = useState(false);

  // Restore session on mount if one exists
  useEffect(() => {
    if (data.currentSession && !isPracticing) {
      setSelectedTuneId(data.currentSession.tuneId);
      setSelectedKey(data.currentSession.key);
      setIsPracticing(true);
    }
  }, [data.currentSession, isPracticing]);

  // Handle Add Tune
  const handleAddTune = useCallback(async () => {
    const trimmedName = newTuneName.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Please enter a tune name");
      return;
    }
    setIsAddingTune(true);
    try {
      await addTune(trimmedName);
      setNewTuneName("");
      setShowAddModal(false);
    } finally {
      setIsAddingTune(false);
    }
  }, [newTuneName, addTune]);

  // Handle Go - start practice
  const handleGo = useCallback(() => {
    let tuneId = selectedTuneId;
    let key = selectedKey;
    let isManualTune = selectedTuneId !== null;
    let isManualKey = selectedKey !== null;
    let pickType = isLearningPick ? "learning" : "reinforcement";

    // If either is not manually selected, use engine
    if (!tuneId || !key) {
      const pick = getNextPick();
      if (!pick) {
        Alert.alert("No Tunes", "Add a tune to start practicing");
        return;
      }
      if (!tuneId) tuneId = pick.tuneId;
      if (!key) key = pick.key;
      pickType = pick.pickType;
    }

    // Set current session
    setCurrentSession({
      tuneId,
      key,
      isManualTune,
      isManualKey,
      pickType,
    });

    // Update local UI state
    setSelectedTuneId(tuneId);
    setSelectedKey(key);
    setIsPracticing(true);

    // Toggle pick type for next time (only if engine selected)
    if (!isManualTune && !isManualKey) {
      toggleLastPickType();
    }
  }, [
    selectedTuneId,
    selectedKey,
    isLearningPick,
    getNextPick,
    setCurrentSession,
    toggleLastPickType,
  ]);

  // Handle rating submission
  const handleSubmitRating = useCallback(
    (rating) => {
      if (selectedTuneId && selectedKey) {
        updateScore(selectedTuneId, selectedKey, rating);
      }

      // Clear session and go to next
      clearCurrentSession();
      setIsPracticing(false);
      setSelectedTuneId(null);
      setSelectedKey(null);
    },
    [selectedTuneId, selectedKey, updateScore, clearCurrentSession],
  );

  // Handle cancel practice
  const handleCancelPractice = useCallback(() => {
    clearCurrentSession();
    setIsPracticing(false);
    setSelectedTuneId(null);
    setSelectedKey(null);
  }, [clearCurrentSession]);

  // Handle archive/restore
  const handleArchive = useCallback(
    (tuneId) => {
      Alert.alert(
        "Archive Tune",
        "Move this tune to archive? You can restore it later.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Archive",
            onPress: () => archiveTune(tuneId),
          },
        ],
      );
    },
    [archiveTune],
  );

  // Handle delete (from archive only)
  const handleDelete = useCallback(
    (tuneId) => {
      Alert.alert(
        "Delete Tune",
        "Permanently delete this tune and all its scores?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteTune(tuneId, true),
          },
        ],
      );
    },
    [deleteTune],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading data</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tune Mastery</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalTunes}</Text>
            <Text style={styles.statLabel}>Tunes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalMastered}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent}>
          {/* Tune List */}
          <TuneList
            tunes={data.activeTunes}
            onReorder={reorderTune}
            onArchive={handleArchive}
            onRename={renameTune}
            onUpdateSettings={updateTuneSettings}
            masteryThreshold={MASTERY_THRESHOLD}
          />

          {/* Add Tune Button */}
          <TouchableOpacity
            style={styles.addTuneButton}
            onPress={() => setShowAddModal(true)}
            accessibilityLabel="Add new tune"
            accessibilityRole="button"
          >
            <Text style={styles.addTuneButtonText}>+ Add Tune</Text>
          </TouchableOpacity>

          {/* Archive Toggle */}
          {data.archivedTunes.length > 0 && (
            <TouchableOpacity
              style={styles.archiveToggle}
              onPress={() => setShowArchive(!showArchive)}
              accessibilityLabel={showArchive ? "Hide archive" : "Show archive"}
              accessibilityRole="button"
            >
              <Text style={styles.archiveToggleText}>
                {showArchive ? "▼" : "▶"} Archive ({data.archivedTunes.length})
              </Text>
            </TouchableOpacity>
          )}

          {/* Archived Tunes */}
          {showArchive && (
            <TuneList
              tunes={data.archivedTunes}
              isArchive
              onRestore={restoreTune}
              onDelete={handleDelete}
              masteryThreshold={MASTERY_THRESHOLD}
            />
          )}
        </ScrollView>

        {/* Selection Panel (when not practicing) */}
        {!isPracticing && (
          <SelectionPanel
            tunes={data.activeTunes}
            selectedTuneId={selectedTuneId}
            selectedKey={selectedKey}
            onSelectTune={setSelectedTuneId}
            onSelectKey={setSelectedKey}
            onGo={handleGo}
            isLearningPick={isLearningPick}
          />
        )}

        {/* Practice Panel Modal (full screen) */}
        <Modal
          visible={isPracticing}
          animationType="slide"
          onRequestClose={handleCancelPractice}
        >
          <PracticePanel
            tuneName={getTuneName(selectedTuneId)}
            tuneKey={selectedKey}
            currentScore={
              data.activeTunes.find((t) => t.id === selectedTuneId)?.keys[
                selectedKey
              ]?.score || 0
            }
            tuneSettings={(() => {
              const tune = data.activeTunes.find(
                (t) => t.id === selectedTuneId,
              );
              return {
                bpm: tune?.bpm || null,
                timeSignature: tune?.timeSignature || "4/4",
                subdivision: tune?.subdivision || 1,
              };
            })()}
            onSubmitRating={handleSubmitRating}
            onCancel={handleCancelPractice}
            settings={data.settings}
          />
        </Modal>

        {/* Add Tune Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>Add New Tune</Text>
              <TextInput
                style={styles.modalInput}
                value={newTuneName}
                onChangeText={setNewTuneName}
                placeholder="Tune name..."
                placeholderTextColor="#666"
                autoFocus
                editable={!isAddingTune}
                onSubmitEditing={handleAddTune}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setNewTuneName("");
                    setShowAddModal(false);
                  }}
                  disabled={isAddingTune}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalAddButton,
                    isAddingTune && styles.modalButtonDisabled,
                  ]}
                  onPress={handleAddTune}
                  disabled={isAddingTune}
                >
                  {isAddingTune ? (
                    <ActivityIndicator size="small" color="#1a1a2e" />
                  ) : (
                    <Text style={styles.modalAddButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Settings Modal */}
        <SettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={data.settings}
          onUpdateSettings={updateSettings}
          onSeedTunes={seedTunes}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

TuneMasteryScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    navigate: PropTypes.func,
  }).isRequired,
};

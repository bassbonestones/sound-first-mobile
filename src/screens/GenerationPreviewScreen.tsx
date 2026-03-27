/**
 * GenerationPreviewScreen
 *
 * Dev tool for previewing the generation engine.
 * Allows parameter configuration, generation, playback, and notation display.
 *
 * State is managed by two custom hooks:
 * - useGeneratorMode: handles scale/arpeggio generation, parameters, randomization, pools
 * - useTunesMode: handles tune preview, transposition, solfège, analysis
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

import { devLog } from "../utils/devLogger";
import colors from "../constants/colors";
import { ScoreViewport } from "../components/ScoreViewport";
import { TempoSlider } from "../components/TempoSlider";
import type {
  GenerationType,
  ScaleType,
  ArpeggioType,
  MusicalKey,
} from "../api/generation";
import { generationPlayback } from "../services/generationPlayback";
import type { ClefType } from "../utils/generationNotation";

// Import hooks that manage the state
import { useGeneratorMode } from "../features/generation-preview/hooks/useGeneratorMode";
import { useTunesMode } from "../features/generation-preview/hooks/useTunesMode";

// Import constants needed for UI rendering
import {
  GENERATION_TYPES,
  SCALE_TYPES,
  ARPEGGIO_TYPES,
  ARPEGGIO_PATTERNS,
  ROOT_KEYS,
  OCTAVES,
  CLEFS,
  RHYTHM_DISPLAY_LABELS,
  formatScaleLabel,
  formatArpeggioLabel,
  formatScalePatternLabel,
  formatArpeggioPatternLabel,
} from "../features/generation-preview/constants/generatorConstants";

// View modes for the screen
type ViewMode = "generator" | "tunes";

// =============================================================================
// Component
// =============================================================================

export default function GenerationPreviewScreen() {
  const navigation = useNavigation();

  // Local state: only view mode coordination
  const [viewMode, setViewMode] = useState<ViewMode>("generator");
  const isPlaybackInitialized = useRef(false);

  // Generator mode hook - handles all generator state
  const generator = useGeneratorMode();

  // Tunes mode hook - handles all tunes preview state
  const tunes = useTunesMode();

  // Initialize playback service
  useEffect(() => {
    const initPlayback = async () => {
      if (!isPlaybackInitialized.current) {
        await generationPlayback.init();
        isPlaybackInitialized.current = true;
      }
    };
    initPlayback();

    return () => {
      generationPlayback.stop();
    };
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      // Stop any active playback when switching modes
      generationPlayback.stop();
      setViewMode(mode);
      if (mode === "tunes" && tunes.previewFiles.length === 0) {
        tunes.loadPreviewFiles();
      }
    },
    [tunes],
  );

  // Toggle pool item helper
  const togglePoolItem = <T extends string>(
    pool: T[],
    setPool: (items: T[]) => void,
    item: T,
  ) => {
    if (pool.includes(item)) {
      setPool(pool.filter((p) => p !== item));
    } else {
      setPool([...pool, item]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generation Preview</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* View Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mode</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                viewMode === "generator" && styles.typeButtonSelected,
              ]}
              onPress={() => handleViewModeChange("generator")}
              accessibilityLabel="Switch to Generator mode"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.typeButtonText,
                  viewMode === "generator" && styles.typeButtonTextSelected,
                ]}
              >
                Generator
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                viewMode === "tunes" && styles.typeButtonSelected,
              ]}
              onPress={() => handleViewModeChange("tunes")}
              accessibilityLabel="Switch to Tunes preview mode"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.typeButtonText,
                  viewMode === "tunes" && styles.typeButtonTextSelected,
                ]}
              >
                Tunes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tunes Preview Mode */}
        {viewMode === "tunes" && (
          <>
            {/* File Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Tune</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tunes.selectedPreviewFile ?? ""}
                  onValueChange={(value) => {
                    if (value) tunes.handlePreviewFile(value);
                  }}
                  style={styles.picker}
                  accessibilityLabel="Select tune file"
                >
                  <Picker.Item label="Choose a file..." value="" />
                  {tunes.previewFiles.map((file) => (
                    <Picker.Item
                      key={file}
                      label={file
                        .replace(/_/g, " ")
                        .replace(/\.musicxml?$/i, "")}
                      value={file}
                    />
                  ))}
                </Picker>
              </View>
              {tunes.previewFiles.length === 0 && (
                <Text style={styles.hintText}>
                  No files in pending folder. Add MusicXML files to
                  resources/materials/pending/
                </Text>
              )}
            </View>

            {/* Loading/Error State */}
            {tunes.isLoadingPreview && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading preview...</Text>
              </View>
            )}
            {tunes.previewError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Error: {tunes.previewError}
                </Text>
              </View>
            )}

            {/* Preview Content */}
            {tunes.previewResponse && !tunes.isLoadingPreview && (
              <>
                {/* Key and Clef Selectors */}
                <View style={styles.section}>
                  <View style={styles.rowContainer}>
                    <View style={styles.halfWidth}>
                      <Text style={styles.sectionLabel}>Key</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={tunes.tuneKey}
                          onValueChange={(value) =>
                            tunes.handleTuneKeyChange(value as MusicalKey)
                          }
                          style={styles.picker}
                          enabled={!tunes.isTransposing}
                          accessibilityLabel="Select key"
                        >
                          {ROOT_KEYS.map((key) => (
                            <Picker.Item key={key} label={key} value={key} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                    <View style={styles.halfWidth}>
                      <Text style={styles.sectionLabel}>Clef</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={tunes.tuneClef}
                          onValueChange={(value) =>
                            tunes.handleTuneClefChange(value as ClefType)
                          }
                          style={styles.picker}
                          enabled={!tunes.isTransposing}
                          accessibilityLabel="Select clef"
                        >
                          {CLEFS.map((c) => (
                            <Picker.Item
                              key={c}
                              label={c.charAt(0).toUpperCase() + c.slice(1)}
                              value={c}
                            />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </View>
                  {tunes.isTransposing && (
                    <View style={styles.transposingIndicator}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.transposingText}>Transposing...</Text>
                    </View>
                  )}
                </View>

                {/* Notation Display */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>
                      {tunes.previewResponse.title}
                      {tunes.previewResponse.original_key_center &&
                        ` (Original: ${tunes.previewResponse.original_key_center})`}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.solfegeToggle,
                        tunes.showSolfege && styles.solfegeToggleActive,
                      ]}
                      onPress={tunes.handleSolfegeToggle}
                      disabled={tunes.isLoadingSolfege}
                      accessibilityLabel="Toggle solfège view"
                      accessibilityRole="switch"
                      accessibilityState={{ checked: tunes.showSolfege }}
                    >
                      {tunes.isLoadingSolfege ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <Text
                          style={[
                            styles.solfegeToggleText,
                            tunes.showSolfege && styles.solfegeToggleTextActive,
                          ]}
                        >
                          {tunes.showSolfege
                            ? "Remove Solfège"
                            : "View Solfège"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.notationContainer}>
                    <ScoreViewport
                      musicXml={tunes.displayXml ?? ""}
                      height={350}
                      fixedWidth={400}
                      playbackState={tunes.playbackState}
                      playbackMeasureIndex={undefined}
                      highlightedNoteIndex={tunes.currentNoteIndex ?? undefined}
                    />
                  </View>
                </View>

                {/* Tempo Slider */}
                <View style={styles.section}>
                  <TempoSlider
                    tempo={tunes.previewTempo}
                    onTempoChange={tunes.handlePreviewTempoChange}
                    minTempo={40}
                    maxTempo={200}
                    label="Preview Tempo"
                  />
                </View>

                {/* Debug Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Analysis</Text>
                  <View style={styles.debugContainer}>
                    <Text style={styles.debugText}>
                      Measures: {tunes.previewResponse.measure_count}
                    </Text>
                    {tunes.previewResponse.tempo_bpm && (
                      <Text style={styles.debugText}>
                        Tempo: {tunes.previewResponse.tempo_bpm} BPM
                        {tunes.previewResponse.tempo_marking &&
                          ` (${previewResponse.tempo_marking})`}
                      </Text>
                    )}
                    <Text style={styles.debugText}>
                      Capabilities: {tunes.previewResponse.capability_count}
                    </Text>
                    {Object.entries(
                      tunes.previewResponse.capabilities_by_domain,
                    ).map(([domain, caps]) => (
                      <Text key={domain} style={styles.debugText}>
                        • {domain}: {(caps as string[]).length}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Soft Gates */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Soft Gates</Text>
                  <View style={styles.debugContainer}>
                    {tunes.previewResponse.soft_gates
                      .interval_sustained_stage !== undefined && (
                      <Text style={styles.debugText}>
                        Interval Sustained:{" "}
                        {
                          tunes.previewResponse.soft_gates
                            .interval_sustained_stage
                        }
                        /6
                      </Text>
                    )}
                    {tunes.previewResponse.soft_gates.interval_hazard_stage !==
                      undefined && (
                      <Text style={styles.debugText}>
                        Interval Hazard:{" "}
                        {tunes.previewResponse.soft_gates.interval_hazard_stage}
                        /6
                      </Text>
                    )}
                    {tunes.previewResponse.soft_gates
                      .rhythm_complexity_stage !== undefined && (
                      <Text style={styles.debugText}>
                        Rhythm Complexity:{" "}
                        {
                          tunes.previewResponse.soft_gates
                            .rhythm_complexity_stage
                        }
                        /6
                      </Text>
                    )}
                    {tunes.previewResponse.soft_gates.tonal_complexity_stage !==
                      undefined && (
                      <Text style={styles.debugText}>
                        Tonal Complexity:{" "}
                        {
                          tunes.previewResponse.soft_gates
                            .tonal_complexity_stage
                        }
                        /5
                      </Text>
                    )}
                    {tunes.previewResponse.soft_gates.range_usage_stage !==
                      undefined && (
                      <Text style={styles.debugText}>
                        Range Usage:{" "}
                        {tunes.previewResponse.soft_gates.range_usage_stage}/6
                      </Text>
                    )}
                  </View>
                </View>

                {/* Unified Scores */}
                {tunes.previewResponse.unified_scores.difficulty_index !==
                  undefined && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Difficulty</Text>
                    <View style={styles.debugContainer}>
                      <Text style={styles.debugText}>
                        Difficulty Index:{" "}
                        {(
                          tunes.previewResponse.unified_scores
                            .difficulty_index * 100
                        ).toFixed(1)}
                        %
                      </Text>
                    </View>
                  </View>
                )}

                {/* Material Analysis */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Material Analysis</Text>
                  {tunes.isLoadingAnalysis ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadingText}>
                        Running analysis...
                      </Text>
                    </View>
                  ) : tunes.materialAnalysis ? (
                    <View style={styles.debugContainer}>
                      {/* Extract key/time signatures from detailed_extraction */}
                      {(() => {
                        const detailed = tunes.materialAnalysis
                          .detailed_extraction as
                          | Record<string, unknown>
                          | undefined;
                        const keySignatures = detailed?.key_signatures as
                          | string[]
                          | undefined;
                        const timeSignatures = detailed?.time_signatures as
                          | string[]
                          | undefined;
                        const rangeAnalysis = detailed?.range_analysis as
                          | {
                              lowest_pitch?: string;
                              highest_pitch?: string;
                            }
                          | undefined;
                        return (
                          <>
                            {keySignatures && keySignatures.length > 0 && (
                              <Text style={styles.debugText}>
                                Key: {keySignatures.join(", ")}
                              </Text>
                            )}
                            {timeSignatures && timeSignatures.length > 0 && (
                              <Text style={styles.debugText}>
                                Time: {timeSignatures.join(", ")}
                              </Text>
                            )}
                            {tunes.materialAnalysis.tempo_bpm && (
                              <Text style={styles.debugText}>
                                Tempo: {tunes.materialAnalysis.tempo_bpm} BPM
                              </Text>
                            )}
                            {rangeAnalysis && (
                              <Text style={styles.debugText}>
                                Range: {rangeAnalysis.lowest_pitch} -{" "}
                                {rangeAnalysis.highest_pitch}
                              </Text>
                            )}
                          </>
                        );
                      })()}
                      {tunes.materialAnalysis.capabilities &&
                        (tunes.materialAnalysis.capabilities as string[])
                          .length > 0 && (
                          <>
                            <Text style={styles.debugText}>
                              Capabilities (
                              {
                                (
                                  tunes.materialAnalysis
                                    .capabilities as string[]
                                ).length
                              }
                              ):
                            </Text>
                            {(
                              tunes.materialAnalysis.capabilities as string[]
                            ).map((cap, idx) => (
                              <Text
                                key={idx}
                                style={[styles.debugText, { marginLeft: 8 }]}
                              >
                                • {cap}
                              </Text>
                            ))}
                          </>
                        )}
                    </View>
                  ) : (
                    <Text style={styles.debugText}>No analysis available</Text>
                  )}
                </View>

                {/* Playback Controls */}
                {tunes.previewResponse.playback_events &&
                  tunes.previewResponse.playback_events.length > 0 && (
                    <View style={styles.playbackSection}>
                      <Text style={styles.sectionLabel}>Playback</Text>
                      <View style={styles.playbackControls}>
                        {tunes.playbackState === "playing" ? (
                          <TouchableOpacity
                            style={styles.playButton}
                            onPress={tunes.handlePause}
                            accessibilityLabel="Pause playback"
                          >
                            <Text style={styles.playButtonText}>⏸ Pause</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.playButton}
                            onPress={tunes.handlePlay}
                            accessibilityLabel="Play tune"
                          >
                            <Text style={styles.playButtonText}>▶️ Play</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.stopButton}
                          onPress={tunes.handleStop}
                          accessibilityLabel="Stop playback"
                        >
                          <Text style={styles.stopButtonText}>⏹ Stop</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.playbackStatus}>
                        State: {tunes.playbackState}
                        {tunes.currentNoteIndex !== null &&
                          ` | Note: ${tunes.currentNoteIndex + 1}/${tunes.previewResponse.playback_events.length}`}
                      </Text>
                    </View>
                  )}
              </>
            )}
          </>
        )}

        {/* Generator Mode - Original UI */}
        {viewMode === "generator" && (
          <>
            {/* Generation Type Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Content Type</Text>
              <View style={styles.buttonRow}>
                {GENERATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      generator.generationType === type &&
                        styles.typeButtonSelected,
                    ]}
                    onPress={() => generator.setGenerationType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        generator.generationType === type &&
                          styles.typeButtonTextSelected,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Scale/Arpeggio Type */}
            {generator.generationType === "scale" ||
            generator.generationType === "lick" ? (
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.sectionLabel}>Scale Type</Text>
                  {generator.randomize.scaleType && (
                    <Text style={styles.randomBadge}>🎲</Text>
                  )}
                </View>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.randomCheckbox}
                    onPress={() => generator.toggleRandomize("scaleType")}
                  >
                    <Text style={styles.checkboxText}>
                      {generator.randomize.scaleType ? "☑" : "☐"}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.pickerContainer,
                      { flex: 1 },
                      generator.randomize.scaleType && styles.pickerDisabled,
                    ]}
                  >
                    <Picker
                      selectedValue={generator.scaleType}
                      onValueChange={(value) =>
                        generator.setScaleType(value as ScaleType)
                      }
                      style={styles.picker}
                      enabled={!generator.randomize.scaleType}
                    >
                      {generator.availableScaleTypes.map((type) => (
                        <Picker.Item
                          key={type}
                          label={formatScaleLabel(type)}
                          value={type}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.sectionLabel}>Arpeggio Type</Text>
                  {generator.randomize.arpeggioType && (
                    <Text style={styles.randomBadge}>🎲</Text>
                  )}
                </View>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.randomCheckbox}
                    onPress={() => generator.toggleRandomize("arpeggioType")}
                  >
                    <Text style={styles.checkboxText}>
                      {generator.randomize.arpeggioType ? "☑" : "☐"}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.pickerContainer,
                      { flex: 1 },
                      generator.randomize.arpeggioType && styles.pickerDisabled,
                    ]}
                  >
                    <Picker
                      selectedValue={generator.arpeggioType}
                      onValueChange={(value) =>
                        generator.setArpeggioType(value as ArpeggioType)
                      }
                      style={styles.picker}
                      enabled={!generator.randomize.arpeggioType}
                    >
                      {ARPEGGIO_TYPES.map((type) => (
                        <Picker.Item
                          key={type}
                          label={formatArpeggioLabel(type)}
                          value={type}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            )}

            {/* Pattern */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Pattern</Text>
                {(generator.generationType === "scale"
                  ? generator.randomize.scalePattern
                  : generator.randomize.arpeggioPattern) && (
                  <Text style={styles.randomBadge}>🎲</Text>
                )}
              </View>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={styles.randomCheckbox}
                  onPress={() =>
                    generator.toggleRandomize(
                      generator.generationType === "scale"
                        ? "scalePattern"
                        : "arpeggioPattern",
                    )
                  }
                >
                  <Text style={styles.checkboxText}>
                    {(
                      generator.generationType === "scale"
                        ? generator.randomize.scalePattern
                        : generator.randomize.arpeggioPattern
                    )
                      ? "☑"
                      : "☐"}
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.pickerContainer,
                    { flex: 1 },
                    (generator.generationType === "scale"
                      ? generator.randomize.scalePattern
                      : generator.randomize.arpeggioPattern) &&
                      styles.pickerDisabled,
                  ]}
                >
                  {generator.generationType === "scale" ? (
                    <Picker
                      selectedValue={generator.scalePattern}
                      onValueChange={(value) =>
                        generator.setScalePattern(value)
                      }
                      style={styles.picker}
                      enabled={!generator.randomize.scalePattern}
                    >
                      {generator.availableScalePatterns.map((pattern) => (
                        <Picker.Item
                          key={pattern}
                          label={formatScalePatternLabel(
                            pattern,
                            generator.scaleType,
                          )}
                          value={pattern}
                        />
                      ))}
                    </Picker>
                  ) : (
                    <Picker
                      selectedValue={generator.arpeggioPattern}
                      onValueChange={(value) =>
                        generator.setArpeggioPattern(value)
                      }
                      style={styles.picker}
                      enabled={!generator.randomize.arpeggioPattern}
                    >
                      {ARPEGGIO_PATTERNS.map((pattern) => (
                        <Picker.Item
                          key={pattern}
                          label={formatArpeggioPatternLabel(pattern)}
                          value={pattern}
                        />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>
            </View>

            {/* Rhythm Type */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Rhythm</Text>
                {generator.randomize.rhythmType && (
                  <Text style={styles.randomBadge}>🎲</Text>
                )}
              </View>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={styles.randomCheckbox}
                  onPress={() => generator.toggleRandomize("rhythmType")}
                >
                  <Text style={styles.checkboxText}>
                    {generator.randomize.rhythmType ? "☑" : "☐"}
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.pickerContainer,
                    { flex: 1 },
                    generator.randomize.rhythmType && styles.pickerDisabled,
                  ]}
                >
                  <Picker
                    selectedValue={generator.rhythmType}
                    onValueChange={(value) => generator.setRhythmType(value)}
                    style={styles.picker}
                    enabled={!generator.randomize.rhythmType}
                  >
                    {generator.availableRhythms.map((r) => (
                      <Picker.Item
                        key={r}
                        label={RHYTHM_DISPLAY_LABELS[r] ?? r.replace(/_/g, " ")}
                        value={r}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Key */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Root Key</Text>
                {generator.randomize.rootKey && (
                  <Text style={styles.randomBadge}>🎲</Text>
                )}
              </View>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={styles.randomCheckbox}
                  onPress={() => generator.toggleRandomize("rootKey")}
                >
                  <Text style={styles.checkboxText}>
                    {generator.randomize.rootKey ? "☑" : "☐"}
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.pickerContainer,
                    { flex: 1 },
                    generator.randomize.rootKey && styles.pickerDisabled,
                  ]}
                >
                  <Picker
                    selectedValue={generator.rootKey}
                    onValueChange={(value) =>
                      generator.setRootKey(value as MusicalKey)
                    }
                    style={styles.picker}
                    enabled={!generator.randomize.rootKey}
                  >
                    {ROOT_KEYS.map((key) => (
                      <Picker.Item key={key} label={key} value={key} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Octave and Range */}
            <View style={styles.rowSection}>
              <View style={styles.halfSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.sectionLabel}>Start Oct</Text>
                  {generator.randomize.startOctave && (
                    <Text style={styles.randomBadge}>🎲</Text>
                  )}
                </View>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.randomCheckbox}
                    onPress={() => generator.toggleRandomize("startOctave")}
                  >
                    <Text style={styles.checkboxText}>
                      {generator.randomize.startOctave ? "☑" : "☐"}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.pickerContainer,
                      { flex: 1 },
                      generator.randomize.startOctave && styles.pickerDisabled,
                    ]}
                  >
                    <Picker
                      selectedValue={generator.startOctave}
                      onValueChange={(value) =>
                        generator.setStartOctave(Number(value))
                      }
                      style={styles.picker}
                      enabled={!generator.randomize.startOctave}
                    >
                      {OCTAVES.map((oct) => (
                        <Picker.Item
                          key={oct}
                          label={String(oct)}
                          value={oct}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              <View style={styles.halfSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.sectionLabel}># Octs</Text>
                  {generator.randomize.numOctaves && (
                    <Text style={styles.randomBadge}>🎲</Text>
                  )}
                </View>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.randomCheckbox}
                    onPress={() => generator.toggleRandomize("numOctaves")}
                  >
                    <Text style={styles.checkboxText}>
                      {generator.randomize.numOctaves ? "☑" : "☐"}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.pickerContainer,
                      { flex: 1 },
                      generator.randomize.numOctaves && styles.pickerDisabled,
                    ]}
                  >
                    <Picker
                      selectedValue={generator.numOctaves}
                      onValueChange={(value) =>
                        generator.setNumOctaves(Number(value) as 1 | 2 | 3)
                      }
                      style={styles.picker}
                      enabled={!generator.randomize.numOctaves}
                    >
                      {[1, 2, 3]
                        .filter((n) => n <= generator.maxOctaves)
                        .map((n) => (
                          <Picker.Item key={n} label={String(n)} value={n} />
                        ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            {/* Clef Selection */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Clef</Text>
                {generator.randomize.clef && (
                  <Text style={styles.randomBadge}>🎲</Text>
                )}
              </View>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={styles.randomCheckbox}
                  onPress={() => generator.toggleRandomize("clef")}
                >
                  <Text style={styles.checkboxText}>
                    {generator.randomize.clef ? "☑" : "☐"}
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.pickerContainer,
                    { flex: 1 },
                    generator.randomize.clef && styles.pickerDisabled,
                  ]}
                >
                  <Picker
                    selectedValue={generator.clef}
                    onValueChange={(value) =>
                      generator.setClef(value as ClefType)
                    }
                    style={styles.picker}
                    enabled={!generator.randomize.clef}
                  >
                    {CLEFS.map((c) => (
                      <Picker.Item
                        key={c}
                        label={c.charAt(0).toUpperCase() + c.slice(1)}
                        value={c}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Pool Mode Toggle */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.poolToggle,
                  generator.poolModeEnabled && styles.poolToggleEnabled,
                ]}
                onPress={() =>
                  generator.setPoolModeEnabled(!generator.poolModeEnabled)
                }
              >
                <Text style={styles.poolToggleText}>
                  {generator.poolModeEnabled
                    ? "🎲 Pool Mode ON"
                    : "Pool Mode OFF"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pool Selection (when enabled) */}
            {generator.poolModeEnabled && (
              <View style={styles.poolSection}>
                <Text style={styles.poolTitle}>Random Selection Pools</Text>

                <Text style={styles.poolSubtitle}>Keys:</Text>
                <View style={styles.poolChipContainer}>
                  {ROOT_KEYS.slice(0, 12).map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.poolChip,
                        generator.keyPool.includes(key) &&
                          styles.poolChipSelected,
                      ]}
                      onPress={() =>
                        togglePoolItem(
                          generator.keyPool,
                          generator.setKeyPool,
                          key,
                        )
                      }
                    >
                      <Text style={styles.poolChipText}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {generator.generationType === "scale" && (
                  <>
                    <Text style={styles.poolSubtitle}>Scales:</Text>
                    <View style={styles.poolChipContainer}>
                      {SCALE_TYPES.slice(0, 8).map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.poolChip,
                            generator.scalePool.includes(type) &&
                              styles.poolChipSelected,
                          ]}
                          onPress={() =>
                            togglePoolItem(
                              generator.scalePool,
                              generator.setScalePool,
                              type,
                            )
                          }
                        >
                          <Text style={styles.poolChipText}>
                            {type.replace(/_/g, " ")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {generator.generationType === "arpeggio" && (
                  <>
                    <Text style={styles.poolSubtitle}>Arpeggios:</Text>
                    <View style={styles.poolChipContainer}>
                      {ARPEGGIO_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.poolChip,
                            generator.arpeggioPool.includes(type) &&
                              styles.poolChipSelected,
                          ]}
                          onPress={() =>
                            togglePoolItem(
                              generator.arpeggioPool,
                              generator.setArpeggioPool,
                              type,
                            )
                          }
                        >
                          <Text style={styles.poolChipText}>
                            {formatArpeggioLabel(type)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Generate Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  generator.isGenerating && styles.generateButtonDisabled,
                ]}
                onPress={generator.handleGenerate}
                disabled={generator.isGenerating}
              >
                {generator.isGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>
                    {generator.poolModeEnabled
                      ? "🎲 Randomize & Generate"
                      : "Generate"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Error Display */}
            {generator.generationError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {generator.generationError}
                </Text>
              </View>
            )}

            {/* Notation Display */}
            {generator.musicXml && (
              <View style={styles.notationSection}>
                <Text style={[styles.sectionLabel, { paddingHorizontal: 16 }]}>
                  Generated Content
                </Text>
                <ScoreViewport
                  musicXml={generator.musicXml}
                  height={350}
                  fixedWidth={2000}
                  playbackState={generator.playbackState}
                  playbackMeasureIndex={generator.playbackMeasureIndex}
                  highlightedNoteIndex={generator.currentNoteIndex ?? undefined}
                  testID="notation-display"
                />
              </View>
            )}

            {/* Playback Controls */}
            {generator.response &&
              generator.response.events &&
              generator.response.events.length > 0 && (
                <View style={styles.playbackSection}>
                  <Text style={styles.sectionLabel}>Playback</Text>
                  <View style={styles.playbackControls}>
                    {generator.playbackState === "playing" ? (
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={generator.handlePause}
                      >
                        <Text style={styles.playButtonText}>⏸ Pause</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={generator.handlePlay}
                      >
                        <Text style={styles.playButtonText}>▶️ Play</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.stopButton}
                      onPress={generator.handleStop}
                    >
                      <Text style={styles.stopButtonText}>⏹ Stop</Text>
                    </TouchableOpacity>
                  </View>
                  <TempoSlider
                    tempo={generator.tempo}
                    tempoRange={generator.response.tempo_range}
                    onTempoChange={generator.handleTempoChange}
                    trackColor={colors.primary}
                    thumbColor={colors.primary}
                  />
                  <Text style={styles.playbackStatus}>
                    State: {generator.playbackState}
                    {generator.currentNoteIndex !== null &&
                      ` | Note: ${generator.currentNoteIndex + 1}/${generator.response.events.length}`}
                  </Text>
                </View>
              )}

            {/* Response Debug Info */}
            {generator.response && (
              <View style={styles.debugSection}>
                <Text style={styles.debugTitle}>Response Info</Text>
                <Text style={styles.debugText}>
                  Events: {generator.response.events?.length ?? 0}
                  {"\n"}Total Beats: {generator.response.total_beats}
                  {"\n"}Key: {generator.response.key} | Octaves:{" "}
                  {generator.response.effective_octaves}
                  {"\n"}Definition: {generator.response.definition}
                </Text>
                {generator.response.capabilities_required &&
                  generator.response.capabilities_required.length > 0 && (
                    <>
                      <Text style={styles.debugSubtitle}>
                        Required Capabilities
                      </Text>
                      <Text style={styles.debugCapabilities}>
                        {generator.response.capabilities_required.join(", ")}
                      </Text>
                    </>
                  )}
                {generator.response.predicted_soft_gates && (
                  <>
                    <Text style={styles.debugSubtitle}>
                      Predicted Soft Gates
                    </Text>
                    <Text style={styles.debugText}>
                      Interval Sustained:{" "}
                      {
                        generator.response.predicted_soft_gates
                          .interval_sustained_stage
                      }
                      /6
                      {"\n"}Interval Hazard:{" "}
                      {
                        generator.response.predicted_soft_gates
                          .interval_hazard_stage
                      }
                      /6
                      {"\n"}Rhythm Complexity:{" "}
                      {(
                        generator.response.predicted_soft_gates
                          .rhythm_complexity_score * 100
                      ).toFixed(0)}
                      %{"\n"}Tonal Stage:{" "}
                      {
                        generator.response.predicted_soft_gates
                          .tonal_complexity_stage
                      }
                      /5 (
                      {generator.response.predicted_soft_gates.accidental_count}{" "}
                      accidentals)
                      {"\n"}Max Interval:{" "}
                      {
                        generator.response.predicted_soft_gates
                          .max_interval_semitones
                      }{" "}
                      semitones
                      {"\n"}P75 Interval:{" "}
                      {
                        generator.response.predicted_soft_gates
                          .interval_p75_semitones
                      }{" "}
                      semitones
                    </Text>
                  </>
                )}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Clef Change Transposition Modal */}
      <Modal
        visible={tunes.clefChangeModal.visible}
        transparent
        animationType="fade"
        onRequestClose={tunes.handleClefChangeCancel}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={tunes.handleClefChangeCancel}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Transpose Notes?</Text>
            <Text style={styles.modalMessage}>
              How would you like to transpose the notes when switching to{" "}
              {tunes.clefChangeModal.targetClef === "bass" ? "bass" : "treble"}{" "}
              clef?
            </Text>
            {tunes.clefChangeModal.targetClef === "bass" ? (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => tunes.handleClefTranspose(0)}
                >
                  <Text style={styles.modalOptionText}>No Transpose</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => tunes.handleClefTranspose(-1)}
                >
                  <Text style={styles.modalOptionText}>Octave Down</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => tunes.handleClefTranspose(-2)}
                >
                  <Text style={styles.modalOptionText}>2 Octaves Down</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => tunes.handleClefTranspose(0)}
                >
                  <Text style={styles.modalOptionText}>No Transpose</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => tunes.handleClefTranspose(1)}
                >
                  <Text style={styles.modalOptionText}>Octave Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => tunes.handleClefTranspose(2)}
                >
                  <Text style={styles.modalOptionText}>2 Octaves Up</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={tunes.handleClefChangeCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Key Change Transposition Modal */}
      <Modal
        visible={tunes.keyChangeModal.visible}
        transparent
        animationType="fade"
        onRequestClose={tunes.handleKeyChangeCancel}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={tunes.handleKeyChangeCancel}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Transpose Notes?</Text>
            <Text style={styles.modalMessage}>
              How would you like to transpose the notes when changing key?
            </Text>
            {(() => {
              const { down, up } = tunes.getKeyTransposeIntervals(
                tunes.keyChangeModal.targetKey,
              );
              return (
                <>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => tunes.handleKeyTranspose(up)}
                  >
                    <Text style={styles.modalOptionText}>Transpose Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => tunes.handleKeyTranspose(down)}
                  >
                    <Text style={styles.modalOptionText}>Transpose Down</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={tunes.handleKeyChangeCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  randomCheckbox: {
    padding: 4,
  },
  checkboxText: {
    fontSize: 40,
    color: colors.primary,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  randomBadge: {
    fontSize: 14,
    marginLeft: "auto",
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: "#fff",
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  rowSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  halfSection: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  transposingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  transposingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  poolToggle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  poolToggleEnabled: {
    backgroundColor: colors.primary,
  },
  poolToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  poolSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  poolTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  poolSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  poolChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  poolChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  poolChipSelected: {
    backgroundColor: colors.primary,
  },
  poolChipText: {
    fontSize: 12,
    color: colors.text,
  },
  generateButton: {
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  errorBox: {
    padding: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  notationSection: {
    marginBottom: 16,
    marginHorizontal: -16, // Escape parent padding to use full width
  },
  playbackSection: {
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  playButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#22c55e",
    alignItems: "center",
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  stopButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  playbackStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  debugSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  debugSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  debugCapabilities: {
    fontSize: 10,
    color: colors.primary,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  solfegeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 70,
    alignItems: "center",
  },
  solfegeToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  solfegeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  solfegeToggleTextActive: {
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

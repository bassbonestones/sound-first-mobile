/**
 * MaterialUploadContent - Upload modal content for materials
 * Handles file selection, analysis preview, and save to database
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { baseUrl } from "../../../../../api/client";
import styles from "../../../styles";

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function MaterialUploadContent({ uploadHook, softGateHelp }) {
  const {
    step: uploadStep,
    setStep: setUploadStep,
    fileName: uploadFileName,
    fileContent: uploadFileContent,
    title: uploadTitle,
    setTitle: setUploadTitle,
    keyCenter: uploadKeyCenter,
    setKeyCenter: setUploadKeyCenter,
    preview: uploadPreview,
    error: uploadError,
    saving: uploadSaving,
    setContent: setUploadFileContent,
    handleFilePick,
    analyzeFile: analyzeUploadedFile,
    confirmUpload,
    closeModal,
  } = uploadHook;

  // Local UI state
  const [showAllCapabilities, setShowAllCapabilities] = useState(false);
  const [allCapabilities, setAllCapabilities] = useState([]);
  const [expandedDomains, setExpandedDomains] = useState({});
  const [expandedProfiles, setExpandedProfiles] = useState({});
  const [softGateHelpVisible, setSoftGateHelpVisible] = useState(null);

  // Load capabilities for domain grouping
  useEffect(() => {
    loadAllCapabilities();
  }, []);

  const loadAllCapabilities = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities`);
      if (response.ok) {
        const data = await response.json();
        setAllCapabilities(data.capabilities || []);
      }
    } catch (err) {
      console.log(
        "[MaterialUpload] Could not load capabilities for domain lookup",
      );
    }
  };

  // Group capabilities by domain
  const groupCapabilitiesByDomain = (capabilityNames) => {
    const capMap = {};
    allCapabilities.forEach((cap) => {
      capMap[cap.name] = cap.domain || "unknown";
    });

    const grouped = {};
    (capabilityNames || []).forEach((capName) => {
      const domain = capMap[capName] || "unknown";
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(capName);
    });

    const sortedDomains = Object.keys(grouped).sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return a.localeCompare(b);
    });

    return { grouped, sortedDomains };
  };

  const toggleDomain = (domain) => {
    setExpandedDomains((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  return (
    <View style={styles.uploadModalContainer}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>
          {uploadStep === "select" ? "Upload Material" : "Analysis Preview"}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.uploadModalContent}>
        {uploadStep === "select" && (
          <View style={styles.uploadSelectStep}>
            {/* File Picker */}
            <Text style={styles.uploadLabel}>MusicXML File</Text>
            <TouchableOpacity
              style={styles.filePickerButton}
              onPress={handleFilePick}
            >
              <Text style={styles.filePickerButtonText}>
                {uploadFileName || "Choose File..."}
              </Text>
            </TouchableOpacity>

            {/* Manual Content Input (for mobile) */}
            {Platform.OS !== "web" && (
              <>
                <Text style={[styles.uploadLabel, { marginTop: 16 }]}>
                  Or paste MusicXML content:
                </Text>
                <TextInput
                  style={styles.xmlContentInput}
                  multiline
                  numberOfLines={8}
                  placeholder="<?xml version='1.0'?>..."
                  value={uploadFileContent}
                  onChangeText={setUploadFileContent}
                />
              </>
            )}

            {/* Title */}
            <Text style={[styles.uploadLabel, { marginTop: 16 }]}>Title</Text>
            <TextInput
              style={styles.uploadInput}
              placeholder="Material title"
              value={uploadTitle}
              onChangeText={setUploadTitle}
            />

            {/* Key Center */}
            <Text style={[styles.uploadLabel, { marginTop: 16 }]}>
              Original Key Center (optional)
            </Text>
            <TextInput
              style={styles.uploadInput}
              placeholder="e.g., C, G, Bb"
              value={uploadKeyCenter}
              onChangeText={setUploadKeyCenter}
            />

            {uploadError && (
              <Text style={styles.uploadError}>{uploadError}</Text>
            )}

            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={analyzeUploadedFile}
              disabled={!uploadFileContent}
            >
              <Text style={styles.analyzeButtonText}>Analyze File</Text>
            </TouchableOpacity>
          </View>
        )}

        {uploadStep === "preview" && uploadPreview && (
          <View style={styles.uploadPreviewStep}>
            {/* Basic Info */}
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Basic Info</Text>
              <DetailRow
                label="Title"
                value={uploadPreview.title || uploadTitle}
              />
              <DetailRow
                label="Measures"
                value={String(uploadPreview.measure_count || "N/A")}
              />
              <DetailRow
                label="Tempo"
                value={
                  uploadPreview.tempo_marking ||
                  (uploadPreview.tempo_bpm
                    ? `${uploadPreview.tempo_bpm} BPM`
                    : "N/A")
                }
              />
            </View>

            {/* Range Analysis */}
            {uploadPreview.range_analysis && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Range Analysis</Text>
                <DetailRow
                  label="Lowest"
                  value={uploadPreview.range_analysis.lowest_pitch || "N/A"}
                />
                <DetailRow
                  label="Highest"
                  value={uploadPreview.range_analysis.highest_pitch || "N/A"}
                />
                <DetailRow
                  label="Range"
                  value={`${uploadPreview.range_analysis.range_semitones || "?"} semitones`}
                />
              </View>
            )}

            {/* Soft Gates */}
            {uploadPreview.soft_gates && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Soft Gate Scores</Text>
                {uploadPreview.soft_gates.error ? (
                  <Text style={styles.uploadError}>
                    Error: {uploadPreview.soft_gates.error}
                  </Text>
                ) : (
                  <View style={styles.softGateGrid}>
                    {/* D1 - Tonal */}
                    <SoftGateCell
                      label="D1 - Tonal Complexity"
                      value={`Stage ${uploadPreview.soft_gates.tonal_complexity_stage ?? "N/A"}`}
                      helpKey="d1_tonal"
                      onHelp={() => setSoftGateHelpVisible("d1_tonal")}
                    />
                    {/* D2 - Interval */}
                    <SoftGateCell
                      label="D2 - Interval Demand"
                      value={`Sustained: ${uploadPreview.soft_gates.interval_sustained_stage ?? "N/A"} | Hazard: ${uploadPreview.soft_gates.interval_hazard_stage ?? "N/A"}`}
                      helpKey="d2_interval"
                      onHelp={() => setSoftGateHelpVisible("d2_interval")}
                      warning={
                        uploadPreview.soft_gates.interval_hazard_stage !=
                          null &&
                        uploadPreview.soft_gates.interval_sustained_stage !=
                          null &&
                        uploadPreview.soft_gates.interval_hazard_stage >
                          uploadPreview.soft_gates.interval_sustained_stage + 1
                          ? "Warning: Large interval spike"
                          : null
                      }
                    />
                    {/* D3 - Rhythm */}
                    <SoftGateCell
                      label="D3 - Rhythm Complexity"
                      value={
                        uploadPreview.soft_gates.rhythm_complexity_score != null
                          ? `${(uploadPreview.soft_gates.rhythm_complexity_score * 100).toFixed(0)}%${
                              uploadPreview.soft_gates.rhythm_complexity_peak !=
                              null
                                ? ` (peak: ${(uploadPreview.soft_gates.rhythm_complexity_peak * 100).toFixed(0)}%)`
                                : ""
                            }`
                          : "N/A"
                      }
                      helpKey="d3_rhythm"
                      onHelp={() => setSoftGateHelpVisible("d3_rhythm")}
                    />
                    {/* D4 - Range */}
                    <SoftGateCell
                      label="D4 - Range Usage"
                      value={`Stage ${uploadPreview.soft_gates.range_usage_stage ?? "N/A"}`}
                      helpKey="d4_range"
                      onHelp={() => setSoftGateHelpVisible("d4_range")}
                    />
                    {/* IVS */}
                    <SoftGateCell
                      label="IVS (Interval Velocity)"
                      value={
                        uploadPreview.soft_gates.interval_velocity_score != null
                          ? `${(uploadPreview.soft_gates.interval_velocity_score * 100).toFixed(0)}%${
                              uploadPreview.soft_gates.interval_velocity_peak !=
                              null
                                ? ` (peak: ${(uploadPreview.soft_gates.interval_velocity_peak * 100).toFixed(0)}%)`
                                : ""
                            }`
                          : "N/A"
                      }
                      helpKey="ivs"
                      onHelp={() => setSoftGateHelpVisible("ivs")}
                    />
                    {/* Tempo */}
                    <SoftGateCell
                      label="Tempo Difficulty"
                      value={
                        uploadPreview.tempo_bpm == null
                          ? "N/A"
                          : uploadPreview.soft_gates.tempo_difficulty_score !=
                              null
                            ? `${(uploadPreview.soft_gates.tempo_difficulty_score * 100).toFixed(0)}%`
                            : "N/A"
                      }
                      helpKey="tempo_diff"
                      onHelp={() => setSoftGateHelpVisible("tempo_diff")}
                    />
                    {/* Notes per Measure */}
                    {uploadPreview.soft_gates.density_notes_per_measure !=
                      null && (
                      <SoftGateCell
                        label="Notes per Measure"
                        value={uploadPreview.soft_gates.density_notes_per_measure.toFixed(
                          1,
                        )}
                        helpKey="notes_measure"
                        onHelp={() => setSoftGateHelpVisible("notes_measure")}
                      />
                    )}
                    {/* Notes per Second */}
                    {uploadPreview.soft_gates.density_notes_per_second !=
                      null && (
                      <SoftGateCell
                        label="Notes per Second"
                        value={uploadPreview.soft_gates.density_notes_per_second.toFixed(
                          2,
                        )}
                        helpKey="notes_second"
                        onHelp={() => setSoftGateHelpVisible("notes_second")}
                      />
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Unified Scores */}
            {uploadPreview.unified_scores &&
              !uploadPreview.unified_scores.error && (
                <UnifiedScoresSection
                  unifiedScores={uploadPreview.unified_scores}
                  expandedProfiles={expandedProfiles}
                  setExpandedProfiles={setExpandedProfiles}
                />
              )}

            {/* Soft Gate Help Modal */}
            <Modal
              visible={softGateHelpVisible !== null}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setSoftGateHelpVisible(null)}
            >
              <TouchableOpacity
                style={styles.helpModalOverlay}
                activeOpacity={1}
                onPress={() => setSoftGateHelpVisible(null)}
              >
                <View style={styles.helpModalContent}>
                  {softGateHelpVisible && softGateHelp[softGateHelpVisible] && (
                    <>
                      <Text style={styles.helpModalTitle}>
                        {softGateHelp[softGateHelpVisible].title}
                      </Text>
                      <Text style={styles.helpModalDescription}>
                        {softGateHelp[softGateHelpVisible].description}
                      </Text>
                      <Text style={styles.helpModalSubtitle}>
                        Stages/Ranges:
                      </Text>
                      {softGateHelp[softGateHelpVisible].stages.map(
                        (stage, idx) => (
                          <Text key={idx} style={styles.helpModalStage}>
                            • {stage}
                          </Text>
                        ),
                      )}
                      <Text style={styles.helpModalSubtitle}>Calculation:</Text>
                      <Text style={styles.helpModalCalc}>
                        {softGateHelp[softGateHelpVisible].calculation}
                      </Text>
                    </>
                  )}
                  <TouchableOpacity
                    style={styles.helpModalClose}
                    onPress={() => setSoftGateHelpVisible(null)}
                  >
                    <Text style={styles.helpModalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Capabilities by Domain */}
            <View style={styles.previewSection}>
              <View style={styles.previewSectionHeader}>
                <Text style={[styles.previewSectionTitle, { marginBottom: 0 }]}>
                  Detected Capabilities ({uploadPreview.capability_count})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAllCapabilities(!showAllCapabilities)}
                  style={styles.toggleCapabilitiesButton}
                >
                  <Text style={styles.toggleCapabilitiesText}>
                    {showAllCapabilities ? "Collapse All" : "Expand All"}
                  </Text>
                </TouchableOpacity>
              </View>

              {(() => {
                let grouped, sortedDomains;
                if (
                  uploadPreview.capabilities_by_domain &&
                  Object.keys(uploadPreview.capabilities_by_domain).length > 0
                ) {
                  grouped = uploadPreview.capabilities_by_domain;
                  sortedDomains = Object.keys(grouped).sort((a, b) => {
                    if (a === "unknown") return 1;
                    if (b === "unknown") return -1;
                    return a.localeCompare(b);
                  });
                } else {
                  const result = groupCapabilitiesByDomain(
                    uploadPreview.capabilities,
                  );
                  grouped = result.grouped;
                  sortedDomains = result.sortedDomains;
                }
                return sortedDomains.map((domain) => {
                  const isExpanded =
                    showAllCapabilities || expandedDomains[domain];
                  const caps = grouped[domain];
                  return (
                    <View key={domain} style={styles.domainSection}>
                      <TouchableOpacity
                        style={styles.domainHeader}
                        onPress={() => toggleDomain(domain)}
                      >
                        <Text style={styles.domainHeaderText}>
                          {isExpanded ? "▼" : "▶"} {domain.replace(/_/g, " ")} (
                          {caps.length})
                        </Text>
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={styles.capabilityTagsContainer}>
                          {caps.map((cap, idx) => (
                            <View key={idx} style={styles.capabilityTag}>
                              <Text style={styles.capabilityTagText}>
                                {cap}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                });
              })()}
            </View>

            {uploadError && (
              <Text style={styles.uploadError}>{uploadError}</Text>
            )}

            {/* Action Buttons */}
            <View style={styles.uploadActions}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setUploadStep("select")}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  uploadSaving && styles.buttonDisabled,
                ]}
                onPress={confirmUpload}
                disabled={uploadSaving}
              >
                {uploadSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Save to Database</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {uploadStep === "preview" && !uploadPreview && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Analyzing...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper component for soft gate cells
function SoftGateCell({ label, value, onHelp, warning }) {
  return (
    <View style={styles.softGateCell}>
      <View style={styles.softGateLabelRow}>
        <Text style={styles.softGateCellLabel}>{label}</Text>
        <TouchableOpacity onPress={onHelp} style={styles.helpButton}>
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.softGateCellValue}>{value}</Text>
      {warning && (
        <Text
          style={[styles.softGateCellValue, { color: "#e74c3c", fontSize: 10 }]}
        >
          {warning}
        </Text>
      )}
    </View>
  );
}

// Helper component for unified scores section
function UnifiedScoresSection({
  unifiedScores,
  expandedProfiles,
  setExpandedProfiles,
}) {
  const domainLabels = {
    interval: "Interval",
    rhythm: "Rhythm",
    tonal: "Tonal",
    tempo: "Tempo",
    range: "Range",
    throughput: "Throughput",
  };

  return (
    <View style={styles.previewSection}>
      <Text style={styles.previewSectionTitle}>
        Unified Scores (Facet Analysis)
      </Text>

      {/* Composite Score */}
      {unifiedScores.composite && (
        <View style={[styles.softGateGrid, { marginBottom: 12 }]}>
          <View style={[styles.softGateCell, { backgroundColor: "#e8f5e9" }]}>
            <Text style={[styles.softGateCellLabel, { fontWeight: "bold" }]}>
              Overall Difficulty
            </Text>
            <Text style={[styles.softGateCellValue, { fontSize: 18 }]}>
              {(unifiedScores.composite.overall * 100).toFixed(0)}%
              {unifiedScores.composite.interaction_bonus > 0 && (
                <Text style={{ fontSize: 10, color: "#e74c3c" }}>
                  {" "}
                  (+
                  {(unifiedScores.composite.interaction_bonus * 100).toFixed(0)}
                  % interaction)
                </Text>
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Domain Breakdown */}
      {["interval", "rhythm", "tonal", "tempo", "range", "throughput"].map(
        (domain) => {
          const domainData = unifiedScores[domain];
          if (!domainData) return null;

          return (
            <View key={domain} style={styles.unifiedScoreDomain}>
              <View style={styles.unifiedScoreDomainHeader}>
                <Text style={styles.unifiedScoreDomainName}>
                  {domainLabels[domain]}
                </Text>
                <View style={styles.unifiedScoreSummary}>
                  {domainData.scores.primary !== null ? (
                    <>
                      <Text style={styles.unifiedScoreLabel}>P:</Text>
                      <Text style={styles.unifiedScoreValue}>
                        {(domainData.scores.primary * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.unifiedScoreLabel}>H:</Text>
                      <Text
                        style={[
                          styles.unifiedScoreValue,
                          domainData.scores.hazard >
                            domainData.scores.primary + 0.15 && {
                            color: "#e74c3c",
                          },
                        ]}
                      >
                        {(domainData.scores.hazard * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.unifiedScoreLabel}>O:</Text>
                      <Text style={styles.unifiedScoreValue}>
                        {(domainData.scores.overall * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.unifiedScoreStage}>
                        Stage {domainData.bands.overall_stage}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.unifiedScoreValue,
                        { color: "#95a5a6", fontStyle: "italic" },
                      ]}
                    >
                      Not scored
                    </Text>
                  )}
                </View>
              </View>

              {/* Facet Scores */}
              <View style={styles.unifiedScoreFacets}>
                {Object.entries(domainData.facet_scores).map(
                  ([facet, value]) => (
                    <View key={facet} style={styles.unifiedScoreFacet}>
                      <Text style={styles.unifiedScoreFacetName}>
                        {facet.replace(/_/g, " ")}
                      </Text>
                      {value !== null ? (
                        <>
                          <View style={styles.unifiedScoreFacetBar}>
                            <View
                              style={[
                                styles.unifiedScoreFacetFill,
                                { width: `${value * 100}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.unifiedScoreFacetValue}>
                            {(value * 100).toFixed(0)}%
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={[
                            styles.unifiedScoreFacetValue,
                            { color: "#95a5a6" },
                          ]}
                        >
                          —
                        </Text>
                      )}
                    </View>
                  ),
                )}
              </View>

              {/* Flags */}
              {domainData.flags && domainData.flags.length > 0 && (
                <View style={styles.unifiedScoreFlags}>
                  {domainData.flags.map((flag, idx) => (
                    <Text key={idx} style={styles.unifiedScoreFlag}>
                      ⚠️ {flag.replace(/_/g, " ")}
                    </Text>
                  ))}
                </View>
              )}

              {/* Profile Details (expandable) */}
              {domainData.profile && (
                <TouchableOpacity
                  style={styles.profileToggle}
                  onPress={() =>
                    setExpandedProfiles((prev) => ({
                      ...prev,
                      [domain]: !prev[domain],
                    }))
                  }
                >
                  <Text style={styles.profileToggleText}>
                    {expandedProfiles[domain] ? "▼" : "▶"} Profile Details
                  </Text>
                </TouchableOpacity>
              )}
              {expandedProfiles[domain] && domainData.profile && (
                <View style={styles.profileDetails}>
                  {Object.entries(domainData.profile).map(([key, value]) => (
                    <View key={key} style={styles.profileRow}>
                      <Text style={styles.profileKey}>
                        {key.replace(/_/g, " ")}:
                      </Text>
                      <Text style={styles.profileValue}>
                        {typeof value === "number"
                          ? Number.isInteger(value)
                            ? value
                            : value.toFixed(4)
                          : (value ?? "null")}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        },
      )}

      {/* Interaction Flags */}
      {unifiedScores.composite?.flags?.length > 0 && (
        <View style={styles.unifiedScoreInteractionFlags}>
          <Text style={styles.unifiedScoreInteractionTitle}>
            Interaction Effects:
          </Text>
          {unifiedScores.composite.flags.map((flag, idx) => (
            <Text key={idx} style={styles.unifiedScoreInteractionFlag}>
              • {flag.replace(/_/g, " ")}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

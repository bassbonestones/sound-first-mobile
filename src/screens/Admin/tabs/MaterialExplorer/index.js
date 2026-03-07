/**
 * MaterialExplorer - Browse materials with analysis data
 * Part of Admin console
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { getBackendUrl, baseUrl } from "../../../../api/client";
import styles from "../../styles";

function MaterialExplorer() {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("1");
  const [ingesting, setIngesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState("select"); // "select" | "preview" | "saving"
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileContent, setUploadFileContent] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadKeyCenter, setUploadKeyCenter] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSaving, setUploadSaving] = useState(false);
  const [showAllCapabilities, setShowAllCapabilities] = useState(false);
  const [allCapabilities, setAllCapabilities] = useState([]);
  const [expandedDomains, setExpandedDomains] = useState({});
  const [expandedProfiles, setExpandedProfiles] = useState({});
  const [softGateHelpVisible, setSoftGateHelpVisible] = useState(null);

  // Soft gate explanations
  const SOFT_GATE_HELP = {
    d1_tonal: {
      title: "D1 - Tonal Complexity",
      description:
        "Measures chromatic complexity based on unique pitch classes and accidental rate (accidentals / total notes). Each stage requires meeting its conditions.",
      stages: [
        "Stage 0: Unison — only 1 unique pitch class",
        "Stage 1: Two-note neighbor — ≤2 pitch classes, accidental rate ≤10%",
        "Stage 2: Diatonic small — ≤5 pitch classes, accidental rate ≤10%",
        "Stage 3: Diatonic broad — ≤7 pitch classes, accidental rate ≤10%",
        "Stage 4: Light chromatic — accidental rate 10-30%",
        "Stage 5: Chromatic — accidental rate >30% or high pitch class count",
      ],
      calculation:
        "pitch_class_count (unique pitch classes 0-12) and accidental_rate (accidentals / total notes)",
    },
    d2_interval: {
      title: "D2 - Interval Demand Profile",
      description:
        "Two-number system: SUSTAINED (p75, for material assignment) and HAZARD (max, for warnings). Sustained shows the typical challenge level. Hazard detects dangerous spikes even if rare.",
      stages: [
        "Sustained Stage (p75-based):",
        "  0: Unison — p75 ≤ 0",
        "  1: Half step — p75 ≤ 1",
        "  2: Whole step — p75 ≤ 2",
        "  3: Thirds — p75 ≤ 4",
        "  4: Fourths/Fifths — p75 ≤ 7",
        "  5: Sixths — p75 ≤ 9",
        "  6: Sevenths+ — p75 ≥ 10",
        "  +1 bump if large_leap_ratio > 15%",
        "",
        "Hazard Stage (max-based):",
        "  Same thresholds but using max interval",
        "  +1 bump if ≥2 extreme leaps in any 16-beat window",
      ],
      calculation:
        "Buckets: step(0-2st), skip(3-5st), leap(6-11st), large_leap(12-17st), extreme(18+st). Warning shown if hazard > sustained + 1.",
    },
    d3_rhythm: {
      title: "D3 - Rhythm Complexity",
      description:
        "Weighted composite of 5 factors. Fast notes alone don't mean high complexity—irregular patterns (ties, dots, tuplets) and frequent rhythm switching are equally important.",
      stages: [
        "0-20%: Simple — uniform note values, no irregularity",
        "20-40%: Easy — some variety, mostly regular patterns",
        "40-60%: Moderate — mixed values (even 16ths), some ties/dots, moderate switching",
        "60-80%: Complex — frequent switching + ties/dots/tuplets + fast intervals",
        "80-100%: Advanced — all factors high: 32nds, tuplets, syncopation, fast leaps",
      ],
      calculation:
        "F1 Subdivision (30%): fastest note type + fast-note density | " +
        "F2 Variety (15%): Shannon entropy of rhythm types | " +
        "F3 Switching (20%): rate of rhythm type changes | " +
        "F4 Irregular (15%): ties 30% + dots 30% + tuplets 40% | " +
        "F5 Motion (20%): rhythm × pitch-change coupling (p75)",
    },
    d4_range: {
      title: "D4 - Range Usage",
      description: "The total pitch range of the piece in semitones.",
      stages: [
        "Stage 0: 0-2 semitones (very narrow)",
        "Stage 1: 3-5 semitones (narrow, ~P4)",
        "Stage 2: 6-7 semitones (P5 range)",
        "Stage 3: 8-12 semitones (up to octave)",
        "Stage 4: 13-17 semitones (octave + P5)",
        "Stage 5: 18-24 semitones (up to 2 octaves)",
        "Stage 6: 25+ semitones (more than 2 octaves)",
      ],
      calculation: "Highest MIDI pitch - Lowest MIDI pitch",
    },
    ivs: {
      title: "IVS - Interval Velocity Score",
      description:
        "Big leaps at fast speeds = higher score. A P5 in 16ths is harder than a P5 in whole notes. Combines mean + p90 for robustness.",
      stages: [
        "0-15%: Mostly stepwise, slow (easy sight-reading)",
        "15-35%: Moderate motion and/or speed",
        "35-60%: Frequent leaps at speed (challenging)",
        "60-100%: Large leaps with short gaps repeatedly (virtuosic)",
      ],
      calculation:
        "Per interval: contrib = (size_norm)^1.0 × (speed_norm)^1.5 | " +
        "size_norm = min(semitones, 12)/12 | " +
        "speed_norm = 1/(1 + dt_quarterLengths) | " +
        "IVS = 70% mean + 30% p90",
    },
    tempo_diff: {
      title: "Tempo Difficulty",
      description:
        "Combined tempo speed difficulty based on the piece's tempo profile. Shows N/A if no tempo marking exists in the score.",
      stages: [
        "0-25%: Slow tempos (≤80 BPM effective)",
        "25-50%: Moderate tempos (80-120 BPM effective)",
        "50-75%: Fast tempos (120-160 BPM effective)",
        "75-100%: Very fast (160+ BPM effective)",
      ],
      calculation:
        "Based on effective BPM (weighted average across tempo regions) and max BPM. Returns N/A if no tempo specified.",
    },
    notes_measure: {
      title: "Notes per Measure",
      description: "Average note density per measure.",
      stages: [
        "1-4: Sparse (whole/half notes)",
        "4-8: Moderate density",
        "8-16: Dense (eighth note passages)",
        "16+: Very dense (16th note runs)",
      ],
      calculation: "Total note count / Measure count",
    },
    notes_second: {
      title: "Notes per Second",
      description: "Tempo-adjusted note density.",
      stages: [
        "0-2: Relaxed pace",
        "2-4: Moderate pace",
        "4-8: Fast pace",
        "8+: Very fast (virtuosic)",
      ],
      calculation: "Notes per measure × (Tempo BPM / 60) / Beats per measure",
    },
  };

  useEffect(() => {
    loadMaterials();
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
        "[AdminScreen] Could not load capabilities for domain lookup",
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

    // Sort domains alphabetically, but put "unknown" last
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

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/materials`);
      if (!response.ok) throw new Error("Failed to load materials");
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (err) {
      console.error("[AdminScreen] Load materials error:", err);
      // Fallback to basic materials endpoint
      try {
        const fallback = await fetch(`${baseUrl}/materials`);
        const data = await fallback.json();
        setMaterials(data.materials || data || []);
      } catch (e) {
        console.error("[AdminScreen] Materials fallback failed:", e);
      }
    }
    setLoading(false);
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => m.title?.toLowerCase().includes(query));
    }

    setFilteredMaterials(filtered);
  };

  const viewMaterialDetail = async (material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);

    // Load analysis data
    try {
      const response = await fetch(
        `${baseUrl}/materials/${material.id}/analysis`,
      );
      if (response.ok) {
        const analysis = await response.json();
        setSelectedMaterial({ ...material, analysis });
      }
    } catch (err) {
      console.log("[AdminScreen] Could not load material analysis");
    }
  };

  const triggerAnalysis = async (materialId) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/materials/${materialId}/analyze`,
        {
          method: "POST",
        },
      );
      if (response.ok) {
        alert("Analysis triggered successfully");
        loadMaterials();
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Analysis failed");
    }
  };

  const handleBatchIngest = async (analyzeAll = false) => {
    setIngesting(true);
    setActionStatus(null);
    try {
      const response = await fetch(`${baseUrl}/materials/ingest-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyze_missing_only: !analyzeAll,
          overwrite: analyzeAll,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setActionStatus({
          type: "success",
          message: `Analyzed ${data.files_analyzed} files, ${data.orphans_removed} orphans removed`,
        });
        loadMaterials();
      } else {
        setActionStatus({
          type: "error",
          message: data.detail || "Ingestion failed",
        });
      }
    } catch (err) {
      console.error("[AdminScreen] Batch ingest error:", err);
      setActionStatus({ type: "error", message: err.message });
    }
    setIngesting(false);
    setTimeout(() => setActionStatus(null), 5000);
  };

  const handleExportToJson = async () => {
    setExporting(true);
    setActionStatus(null);
    try {
      const response = await fetch(`${baseUrl}/materials/export-json`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setActionStatus({
          type: "success",
          message: `Exported to ${data.path}`,
        });
      } else {
        setActionStatus({
          type: "error",
          message: data.detail || "Export failed",
        });
      }
    } catch (err) {
      console.error("[AdminScreen] Export error:", err);
      setActionStatus({ type: "error", message: err.message });
    }
    setExporting(false);
    setTimeout(() => setActionStatus(null), 5000);
  };

  // === UPLOAD FUNCTIONS ===

  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadStep("select");
    setUploadFileName("");
    setUploadFileContent("");
    setUploadTitle("");
    setUploadKeyCenter("");
    setUploadPreview(null);
    setUploadError(null);
    setShowAllCapabilities(false);
  };

  const handleFilePick = async () => {
    // For web/desktop, use file input
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".xml,.musicxml";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadFileName(file.name);
          const content = await file.text();
          setUploadFileContent(content);
          const nameWithoutExt = file.name.replace(/\.(xml|musicxml)$/i, "");
          setUploadTitle(nameWithoutExt);
        }
      };
      input.click();
    } else {
      alert("On mobile, please paste MusicXML content in the text area below.");
    }
  };

  const analyzeUploadedFile = async () => {
    if (!uploadFileContent) {
      setUploadError("Please select or paste a MusicXML file first");
      return;
    }

    setUploadStep("preview");
    setUploadError(null);

    try {
      const response = await fetch(`${baseUrl}/materials/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle || "Untitled",
          musicxml_content: uploadFileContent,
          original_key_center: uploadKeyCenter || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const preview = await response.json();
      console.log(
        "[AdminScreen] Preview response:",
        JSON.stringify(preview.unified_scores, null, 2),
      );
      setUploadPreview(preview);
      if (preview.title && !uploadTitle) {
        setUploadTitle(preview.title);
      }
    } catch (err) {
      setUploadError(err.message);
      setUploadStep("select");
    }
  };

  const confirmUpload = async () => {
    if (!uploadPreview) return;

    setUploadSaving(true);
    setUploadError(null);

    try {
      const response = await fetch(`${baseUrl}/materials/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle || uploadPreview.title || "Untitled",
          musicxml_content: uploadFileContent,
          original_key_center: uploadKeyCenter || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Upload failed");
      }

      const result = await response.json();
      alert(`Material saved successfully! ID: ${result.material_id}`);
      setShowUploadModal(false);
      loadMaterials();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadSaving(false);
    }
  };

  const renderMaterialItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => viewMaterialDetail(item)}
    >
      <View style={styles.listItemHeader}>
        <Text style={styles.listItemTitle}>{item.title}</Text>
        <Text style={styles.listItemBadge}>
          {item.original_key_center || "?"}
        </Text>
      </View>
      <View style={styles.listItemDetails}>
        <Text style={styles.listItemDetail}>ID: {item.id}</Text>
        {item.lowest_pitch && (
          <Text style={styles.listItemDetail}>
            Range: {item.lowest_pitch} - {item.highest_pitch}
          </Text>
        )}
        {item.difficulty_index != null && (
          <Text style={styles.listItemDetail}>
            Difficulty: {(item.difficulty_index * 100).toFixed(0)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading materials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Search and Upload */}
      <View style={styles.filterBar}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search materials..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.uploadButton} onPress={openUploadModal}>
          <Text style={styles.uploadButtonText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {/* User selector for gate checks */}
      <View style={styles.userSelector}>
        <Text style={styles.userSelectorLabel}>Check gates for user:</Text>
        <TextInput
          style={styles.userIdInput}
          value={selectedUserId}
          onChangeText={setSelectedUserId}
          keyboardType="numeric"
          placeholder="User ID"
        />
      </View>

      <Text style={styles.resultCount}>
        {filteredMaterials.length} materials
      </Text>

      {/* Batch Actions */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            ingesting && styles.actionButtonDisabled,
          ]}
          onPress={() => handleBatchIngest(false)}
          disabled={ingesting || exporting}
        >
          <Text style={styles.actionButtonText}>
            {ingesting ? "Analyzing..." : "Analyze New"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            ingesting && styles.actionButtonDisabled,
          ]}
          onPress={() => handleBatchIngest(true)}
          disabled={ingesting || exporting}
        >
          <Text style={styles.actionButtonText}>Re-analyze All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.exportButton,
            exporting && styles.actionButtonDisabled,
          ]}
          onPress={handleExportToJson}
          disabled={ingesting || exporting}
        >
          <Text style={styles.actionButtonText}>
            {exporting ? "Exporting..." : "Export JSON"}
          </Text>
        </TouchableOpacity>
      </View>

      {actionStatus && (
        <View
          style={[
            styles.statusBanner,
            actionStatus.type === "success"
              ? styles.statusSuccess
              : styles.statusError,
          ]}
        >
          <Text style={styles.statusText}>{actionStatus.message}</Text>
        </View>
      )}

      <FlatList
        data={filteredMaterials}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <MaterialDetailView
          material={selectedMaterial}
          userId={selectedUserId}
          onClose={() => setShowDetailModal(false)}
          onTriggerAnalysis={triggerAnalysis}
        />
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.uploadModalContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>
              {uploadStep === "select" ? "Upload Material" : "Analysis Preview"}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUploadModal(false)}
            >
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
                <Text style={[styles.uploadLabel, { marginTop: 16 }]}>
                  Title
                </Text>
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
                    <Text style={styles.previewSectionTitle}>
                      Range Analysis
                    </Text>
                    <DetailRow
                      label="Lowest"
                      value={uploadPreview.range_analysis.lowest_pitch || "N/A"}
                    />
                    <DetailRow
                      label="Highest"
                      value={
                        uploadPreview.range_analysis.highest_pitch || "N/A"
                      }
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
                    <Text style={styles.previewSectionTitle}>
                      Soft Gate Scores
                    </Text>
                    {uploadPreview.soft_gates.error ? (
                      <Text style={styles.uploadError}>
                        Error: {uploadPreview.soft_gates.error}
                      </Text>
                    ) : (
                      <View style={styles.softGateGrid}>
                        <View style={styles.softGateCell}>
                          <View style={styles.softGateLabelRow}>
                            <Text style={styles.softGateCellLabel}>
                              D1 - Tonal Complexity
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSoftGateHelpVisible("d1_tonal")}
                              style={styles.helpButton}
                            >
                              <Text style={styles.helpButtonText}>?</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.softGateCellValue}>
                            Stage{" "}
                            {uploadPreview.soft_gates.tonal_complexity_stage ??
                              "N/A"}
                          </Text>
                        </View>
                        <View style={styles.softGateCell}>
                          <View style={styles.softGateLabelRow}>
                            <Text style={styles.softGateCellLabel}>
                              D2 - Interval Demand
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                setSoftGateHelpVisible("d2_interval")
                              }
                              style={styles.helpButton}
                            >
                              <Text style={styles.helpButtonText}>?</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.softGateCellValue}>
                            Sustained:{" "}
                            {uploadPreview.soft_gates
                              .interval_sustained_stage ?? "N/A"}{" "}
                            | Hazard:{" "}
                            {uploadPreview.soft_gates.interval_hazard_stage ??
                              "N/A"}
                          </Text>
                          {uploadPreview.soft_gates.interval_hazard_stage !=
                            null &&
                            uploadPreview.soft_gates.interval_sustained_stage !=
                              null &&
                            uploadPreview.soft_gates.interval_hazard_stage >
                              uploadPreview.soft_gates
                                .interval_sustained_stage +
                                1 && (
                              <Text
                                style={[
                                  styles.softGateCellValue,
                                  { color: "#e74c3c", fontSize: 10 },
                                ]}
                              >
                                Warning: Large interval spike
                              </Text>
                            )}
                        </View>
                        <View style={styles.softGateCell}>
                          <View style={styles.softGateLabelRow}>
                            <Text style={styles.softGateCellLabel}>
                              D3 - Rhythm Complexity
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                setSoftGateHelpVisible("d3_rhythm")
                              }
                              style={styles.helpButton}
                            >
                              <Text style={styles.helpButtonText}>?</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.softGateCellValue}>
                            {uploadPreview.soft_gates.rhythm_complexity_score !=
                            null
                              ? `${(uploadPreview.soft_gates.rhythm_complexity_score * 100).toFixed(0)}%`
                              : "N/A"}
                            {uploadPreview.soft_gates.rhythm_complexity_peak !=
                            null
                              ? ` (peak: ${(uploadPreview.soft_gates.rhythm_complexity_peak * 100).toFixed(0)}%)`
                              : ""}
                          </Text>
                        </View>
                        <View style={styles.softGateCell}>
                          <View style={styles.softGateLabelRow}>
                            <Text style={styles.softGateCellLabel}>
                              D4 - Range Usage
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSoftGateHelpVisible("d4_range")}
                              style={styles.helpButton}
                            >
                              <Text style={styles.helpButtonText}>?</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.softGateCellValue}>
                            Stage{" "}
                            {uploadPreview.soft_gates.range_usage_stage ??
                              "N/A"}
                          </Text>
                        </View>
                        <View style={styles.softGateCell}>
                          <View style={styles.softGateLabelRow}>
                            <Text style={styles.softGateCellLabel}>
                              IVS (Interval Velocity)
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSoftGateHelpVisible("ivs")}
                              style={styles.helpButton}
                            >
                              <Text style={styles.helpButtonText}>?</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.softGateCellValue}>
                            {uploadPreview.soft_gates.interval_velocity_score !=
                            null
                              ? `${(uploadPreview.soft_gates.interval_velocity_score * 100).toFixed(0)}%`
                              : "N/A"}
                            {uploadPreview.soft_gates.interval_velocity_peak !=
                            null
                              ? ` (peak: ${(uploadPreview.soft_gates.interval_velocity_peak * 100).toFixed(0)}%)`
                              : ""}
                          </Text>
                        </View>
                        <View style={styles.softGateCell}>
                          <View style={styles.softGateLabelRow}>
                            <Text style={styles.softGateCellLabel}>
                              Tempo Difficulty
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                setSoftGateHelpVisible("tempo_diff")
                              }
                              style={styles.helpButton}
                            >
                              <Text style={styles.helpButtonText}>?</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.softGateCellValue}>
                            {uploadPreview.tempo_bpm == null
                              ? "N/A"
                              : uploadPreview.soft_gates
                                    .tempo_difficulty_score != null
                                ? `${(uploadPreview.soft_gates.tempo_difficulty_score * 100).toFixed(0)}%`
                                : "N/A"}
                          </Text>
                        </View>
                        {uploadPreview.soft_gates.density_notes_per_measure !=
                          null && (
                          <View style={styles.softGateCell}>
                            <View style={styles.softGateLabelRow}>
                              <Text style={styles.softGateCellLabel}>
                                Notes per Measure
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  setSoftGateHelpVisible("notes_measure")
                                }
                                style={styles.helpButton}
                              >
                                <Text style={styles.helpButtonText}>?</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.softGateCellValue}>
                              {uploadPreview.soft_gates.density_notes_per_measure.toFixed(
                                1,
                              )}
                            </Text>
                          </View>
                        )}
                        {uploadPreview.soft_gates.density_notes_per_second !=
                          null && (
                          <View style={styles.softGateCell}>
                            <View style={styles.softGateLabelRow}>
                              <Text style={styles.softGateCellLabel}>
                                Notes per Second
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  setSoftGateHelpVisible("notes_second")
                                }
                                style={styles.helpButton}
                              >
                                <Text style={styles.helpButtonText}>?</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.softGateCellValue}>
                              {uploadPreview.soft_gates.density_notes_per_second.toFixed(
                                2,
                              )}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Unified Scores (Facet-Aware) */}
                {uploadPreview.unified_scores &&
                  !uploadPreview.unified_scores.error && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewSectionTitle}>
                        Unified Scores (Facet Analysis)
                      </Text>

                      {/* Composite Score */}
                      {uploadPreview.unified_scores.composite && (
                        <View
                          style={[styles.softGateGrid, { marginBottom: 12 }]}
                        >
                          <View
                            style={[
                              styles.softGateCell,
                              { backgroundColor: "#e8f5e9" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.softGateCellLabel,
                                { fontWeight: "bold" },
                              ]}
                            >
                              Overall Difficulty
                            </Text>
                            <Text
                              style={[
                                styles.softGateCellValue,
                                { fontSize: 18 },
                              ]}
                            >
                              {(
                                uploadPreview.unified_scores.composite.overall *
                                100
                              ).toFixed(0)}
                              %
                              {uploadPreview.unified_scores.composite
                                .interaction_bonus > 0 && (
                                <Text
                                  style={{ fontSize: 10, color: "#e74c3c" }}
                                >
                                  {" "}
                                  (+
                                  {(
                                    uploadPreview.unified_scores.composite
                                      .interaction_bonus * 100
                                  ).toFixed(0)}
                                  % interaction)
                                </Text>
                              )}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Domain Breakdown */}
                      {[
                        "interval",
                        "rhythm",
                        "tonal",
                        "tempo",
                        "range",
                        "throughput",
                      ].map((domain) => {
                        const domainData = uploadPreview.unified_scores[domain];
                        if (!domainData) return null;

                        const domainLabels = {
                          interval: "Interval",
                          rhythm: "Rhythm",
                          tonal: "Tonal",
                          tempo: "Tempo",
                          range: "Range",
                          throughput: "Throughput",
                        };

                        return (
                          <View key={domain} style={styles.unifiedScoreDomain}>
                            <View style={styles.unifiedScoreDomainHeader}>
                              <Text style={styles.unifiedScoreDomainName}>
                                {domainLabels[domain]}
                              </Text>
                              <View style={styles.unifiedScoreSummary}>
                                {domainData.scores.primary !== null ? (
                                  <>
                                    <Text style={styles.unifiedScoreLabel}>
                                      P:
                                    </Text>
                                    <Text style={styles.unifiedScoreValue}>
                                      {(
                                        domainData.scores.primary * 100
                                      ).toFixed(0)}
                                      %
                                    </Text>
                                    <Text style={styles.unifiedScoreLabel}>
                                      H:
                                    </Text>
                                    <Text
                                      style={[
                                        styles.unifiedScoreValue,
                                        domainData.scores.hazard >
                                          domainData.scores.primary + 0.15 && {
                                          color: "#e74c3c",
                                        },
                                      ]}
                                    >
                                      {(domainData.scores.hazard * 100).toFixed(
                                        0,
                                      )}
                                      %
                                    </Text>
                                    <Text style={styles.unifiedScoreLabel}>
                                      O:
                                    </Text>
                                    <Text style={styles.unifiedScoreValue}>
                                      {(
                                        domainData.scores.overall * 100
                                      ).toFixed(0)}
                                      %
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
                                  <View
                                    key={facet}
                                    style={styles.unifiedScoreFacet}
                                  >
                                    <Text style={styles.unifiedScoreFacetName}>
                                      {facet.replace(/_/g, " ")}
                                    </Text>
                                    {value !== null ? (
                                      <>
                                        <View
                                          style={styles.unifiedScoreFacetBar}
                                        >
                                          <View
                                            style={[
                                              styles.unifiedScoreFacetFill,
                                              { width: `${value * 100}%` },
                                            ]}
                                          />
                                        </View>
                                        <Text
                                          style={styles.unifiedScoreFacetValue}
                                        >
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
                            {domainData.flags &&
                              domainData.flags.length > 0 && (
                                <View style={styles.unifiedScoreFlags}>
                                  {domainData.flags.map((flag, idx) => (
                                    <Text
                                      key={idx}
                                      style={styles.unifiedScoreFlag}
                                    >
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
                                  {expandedProfiles[domain] ? "▼" : "▶"} Profile
                                  Details
                                </Text>
                              </TouchableOpacity>
                            )}
                            {expandedProfiles[domain] && domainData.profile && (
                              <View style={styles.profileDetails}>
                                {Object.entries(domainData.profile).map(
                                  ([key, value]) => (
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
                                  ),
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}

                      {/* Interaction Flags */}
                      {uploadPreview.unified_scores.composite?.flags?.length >
                        0 && (
                        <View style={styles.unifiedScoreInteractionFlags}>
                          <Text style={styles.unifiedScoreInteractionTitle}>
                            Interaction Effects:
                          </Text>
                          {uploadPreview.unified_scores.composite.flags.map(
                            (flag, idx) => (
                              <Text
                                key={idx}
                                style={styles.unifiedScoreInteractionFlag}
                              >
                                • {flag.replace(/_/g, " ")}
                              </Text>
                            ),
                          )}
                        </View>
                      )}
                    </View>
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
                      {softGateHelpVisible &&
                        SOFT_GATE_HELP[softGateHelpVisible] && (
                          <>
                            <Text style={styles.helpModalTitle}>
                              {SOFT_GATE_HELP[softGateHelpVisible].title}
                            </Text>
                            <Text style={styles.helpModalDescription}>
                              {SOFT_GATE_HELP[softGateHelpVisible].description}
                            </Text>
                            <Text style={styles.helpModalSubtitle}>
                              Stages/Ranges:
                            </Text>
                            {SOFT_GATE_HELP[softGateHelpVisible].stages.map(
                              (stage, idx) => (
                                <Text key={idx} style={styles.helpModalStage}>
                                  • {stage}
                                </Text>
                              ),
                            )}
                            <Text style={styles.helpModalSubtitle}>
                              Calculation:
                            </Text>
                            <Text style={styles.helpModalCalc}>
                              {SOFT_GATE_HELP[softGateHelpVisible].calculation}
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
                    <Text
                      style={[styles.previewSectionTitle, { marginBottom: 0 }]}
                    >
                      Detected Capabilities ({uploadPreview.capability_count})
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setShowAllCapabilities(!showAllCapabilities)
                      }
                      style={styles.toggleCapabilitiesButton}
                    >
                      <Text style={styles.toggleCapabilitiesText}>
                        {showAllCapabilities ? "Collapse All" : "Expand All"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Grouped by domain - use API response if available, fallback to local grouping */}
                  {(() => {
                    let grouped, sortedDomains;
                    if (
                      uploadPreview.capabilities_by_domain &&
                      Object.keys(uploadPreview.capabilities_by_domain).length >
                        0
                    ) {
                      // Use domain grouping from API
                      grouped = uploadPreview.capabilities_by_domain;
                      sortedDomains = Object.keys(grouped).sort((a, b) => {
                        if (a === "unknown") return 1;
                        if (b === "unknown") return -1;
                        return a.localeCompare(b);
                      });
                    } else {
                      // Fallback to local grouping
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
                              {isExpanded ? "▼" : "▶"}{" "}
                              {domain.replace(/_/g, " ")} ({caps.length})
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
                      <Text style={styles.confirmButtonText}>
                        Save to Database
                      </Text>
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
      </Modal>
    </View>
  );
}

function MaterialDetailView({ material, userId, onClose, onTriggerAnalysis }) {
  const [gateStatus, setGateStatus] = useState(null);
  const [loadingGates, setLoadingGates] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeResult, setReanalyzeResult] = useState(null);

  useEffect(() => {
    if (material && userId) {
      loadGateStatus();
    }
  }, [material, userId]);

  const loadGateStatus = async () => {
    setLoadingGates(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/materials/${material.id}/gate-check?user_id=${userId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setGateStatus(data);
      }
    } catch (err) {
      console.log("[AdminScreen] Gate check failed");
    }
    setLoadingGates(false);
  };

  const handleReanalyze = async (metrics = null) => {
    setReanalyzing(true);
    setReanalyzeResult(null);
    try {
      const response = await fetch(
        `${baseUrl}/materials/${material.id}/reanalyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metrics }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setReanalyzeResult({
          type: "success",
          message: `Updated: ${data.metrics_updated.join(", ")}`,
          data,
        });
        // Reload material analysis
        if (onTriggerAnalysis) {
          onTriggerAnalysis(material.id);
        }
      } else {
        setReanalyzeResult({
          type: "error",
          message: data.detail || "Reanalysis failed",
        });
      }
    } catch (err) {
      console.error("[AdminScreen] Reanalyze error:", err);
      setReanalyzeResult({ type: "error", message: err.message });
    }
    setReanalyzing(false);
  };

  if (!material) return null;

  const analysis = material.analysis || {};

  return (
    <ScrollView style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>{material.title}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Basic Info</Text>
        <DetailRow label="ID" value={String(material.id)} />
        <DetailRow label="Title" value={material.title} />
        <DetailRow
          label="Original Key"
          value={material.original_key_center || "Unknown"}
        />
        <DetailRow
          label="Allowed Keys"
          value={material.allowed_keys || "Any"}
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Analysis</Text>
        <DetailRow
          label="Lowest Pitch"
          value={analysis.lowest_pitch || "N/A"}
        />
        <DetailRow
          label="Highest Pitch"
          value={analysis.highest_pitch || "N/A"}
        />
        <DetailRow
          label="Range (semitones)"
          value={String(analysis.range_semitones || "N/A")}
        />
        <DetailRow
          label="Chromatic Complexity"
          value={analysis.chromatic_complexity?.toFixed(2) || "N/A"}
        />
        <DetailRow
          label="Rhythmic Complexity"
          value={analysis.rhythmic_complexity?.toFixed(2) || "N/A"}
        />
        <DetailRow
          label="Reading Complexity"
          value={analysis.reading_complexity?.toFixed(2) || "N/A"}
        />
        <DetailRow
          label="Measures"
          value={String(analysis.measure_count || "N/A")}
        />
        <DetailRow
          label="Duration (sec)"
          value={String(analysis.estimated_duration_seconds || "N/A")}
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Soft Gate Stages</Text>
        <DetailRow
          label="Tonal Stage"
          value={String(analysis.tonal_complexity_stage ?? "N/A")}
        />
        <DetailRow
          label="Interval Sustained"
          value={String(analysis.interval_sustained_stage ?? "N/A")}
        />
        <DetailRow
          label="Interval Hazard"
          value={String(analysis.interval_hazard_stage ?? "N/A")}
        />
        <DetailRow
          label="Rhythm Stage"
          value={String(analysis.rhythm_complexity_stage ?? "N/A")}
        />
        <DetailRow
          label="Range Stage"
          value={String(analysis.range_usage_stage ?? "N/A")}
        />
        <DetailRow
          label="Difficulty Index"
          value={
            analysis.difficulty_index != null
              ? (analysis.difficulty_index * 100).toFixed(1) + "%"
              : "N/A"
          }
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Gate Status (User {userId})
        </Text>
        {loadingGates ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : gateStatus ? (
          <>
            <DetailRow
              label="Hard Gates"
              value={gateStatus.passes_hard_gates ? "✓ PASS" : "✗ FAIL"}
              valueStyle={{
                color: gateStatus.passes_hard_gates ? "#4CAF50" : "#f44336",
              }}
            />
            {gateStatus.hard_gate_failures?.length > 0 && (
              <Text style={styles.failureList}>
                Failed: {gateStatus.hard_gate_failures.join(", ")}
              </Text>
            )}
            <DetailRow
              label="Soft Envelope"
              value={gateStatus.passes_soft_envelope ? "✓ PASS" : "✗ FAIL"}
              valueStyle={{
                color: gateStatus.passes_soft_envelope ? "#4CAF50" : "#f44336",
              }}
            />
            {gateStatus.soft_envelope_failures?.length > 0 && (
              <Text style={styles.failureList}>
                Failed: {gateStatus.soft_envelope_failures.join(", ")}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noDataText}>Gate status not available</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Required Capabilities</Text>
        {material.required_capabilities?.length > 0 ? (
          material.required_capabilities.map((cap, idx) => (
            <Text key={idx} style={styles.prerequisiteItem}>
              • {cap}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Not available</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Teaches Capabilities</Text>
        {material.teaches_capabilities?.length > 0 ? (
          material.teaches_capabilities.map((cap, idx) => (
            <Text key={idx} style={styles.prerequisiteItem}>
              • {cap}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Not available</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Actions</Text>
        <View style={styles.actionButtonRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              reanalyzing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleReanalyze(null)}
            disabled={reanalyzing}
          >
            <Text style={styles.actionButtonText}>
              {reanalyzing ? "Analyzing..." : "Reanalyze All"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              reanalyzing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleReanalyze(["soft_gates"])}
            disabled={reanalyzing}
          >
            <Text style={styles.actionButtonText}>Soft Gates Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              reanalyzing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleReanalyze(["capabilities"])}
            disabled={reanalyzing}
          >
            <Text style={styles.actionButtonText}>Capabilities Only</Text>
          </TouchableOpacity>
        </View>
        {reanalyzeResult && (
          <View
            style={[
              styles.statusBanner,
              reanalyzeResult.type === "success"
                ? styles.statusSuccess
                : styles.statusError,
            ]}
          >
            <Text style={styles.statusText}>{reanalyzeResult.message}</Text>
            {reanalyzeResult.data?.soft_gates && (
              <Text style={styles.statusText}>
                IVS: {reanalyzeResult.data.soft_gates.interval_velocity_score}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function DetailRow({ label, value, valueStyle }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}

// =============================================================================
// SECTION 3: USER PROGRESSION INSPECTOR
// =============================================================================

export default MaterialExplorer;

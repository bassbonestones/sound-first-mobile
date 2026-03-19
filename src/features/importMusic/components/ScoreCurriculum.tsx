/**
 * ScoreCurriculum Component
 *
 * Displays a learning path for an imported score based on discovered capabilities.
 * Shows which capabilities the user already knows and which they need to learn,
 * ordered by prerequisites.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, fontSizes } from "../../../constants";
import { devLog } from "../../../utils/devLogger";
import type {
  LearningPathResponse,
  LearningPathCapability,
} from "../types/analysisTypes";
import {
  generateLearningPath,
  generateLearningPathMock,
} from "../services/capabilityAnalysisService";
import { DOMAIN_DISPLAY_INFO } from "../types/analysisTypes";

// ============================================================================
// Types
// ============================================================================

export interface ScoreCurriculumProps {
  /** Capability names from the score analysis */
  capabilityNames: string[];
  /** User ID to check mastery against */
  userId: number;
  /** Use mock data instead of real API */
  useMock?: boolean;
  /** Called when a capability is selected */
  onCapabilityPress?: (capability: LearningPathCapability) => void;
  /** Called when user wants to start learning */
  onStartLearning?: (learningPath: LearningPathResponse) => void;
}

type LoadState = "idle" | "loading" | "success" | "error";

// ============================================================================
// Component
// ============================================================================

export function ScoreCurriculum({
  capabilityNames,
  userId,
  useMock = false,
  onCapabilityPress,
  onStartLearning,
}: ScoreCurriculumProps) {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [learningPath, setLearningPath] = useState<LearningPathResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set(),
  );

  // Load learning path when capabilities change
  useEffect(() => {
    if (capabilityNames.length === 0) {
      setLoadState("idle");
      setLearningPath(null);
      return;
    }

    const load = async () => {
      setLoadState("loading");
      setError(null);

      devLog("ScoreCurriculum: Loading learning path", {
        capabilityCount: capabilityNames.length,
        userId,
        useMock,
      });

      const result = useMock
        ? await generateLearningPathMock(capabilityNames, userId)
        : await generateLearningPath(capabilityNames, userId);

      if (result.success) {
        setLearningPath(result.data);
        setLoadState("success");

        // Auto-expand first domain with unmastered caps
        if (result.data.path_by_domain) {
          const firstDomain = Object.keys(result.data.path_by_domain)[0];
          if (firstDomain) {
            setExpandedDomains(new Set([firstDomain]));
          }
        }
      } else {
        setError(result.error.message);
        setLoadState("error");
      }
    };

    load();
  }, [capabilityNames, userId, useMock]);

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderSummary = () => {
    if (!learningPath) return null;

    const { capabilities_already_mastered, capabilities_to_learn } =
      learningPath;
    const total = capabilities_already_mastered + capabilities_to_learn;
    const progress =
      total > 0 ? Math.round((capabilities_already_mastered / total) * 100) : 0;

    return (
      <View style={styles.summary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Your Progress</Text>
          <Text style={styles.summaryPercent}>{progress}%</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={styles.statText}>
              {capabilities_already_mastered} mastered
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="target" size={16} color={colors.warning} />
            <Text style={styles.statText}>
              {capabilities_to_learn} to learn
            </Text>
          </View>
        </View>

        {capabilities_to_learn > 0 && onStartLearning && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => onStartLearning(learningPath)}
            testID="start-learning-button"
          >
            <Text style={styles.startButtonText}>Start Learning Path</Text>
            <Feather name="arrow-right" size={20} color={colors.background} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCapability = (cap: LearningPathCapability) => {
    const domainInfo = DOMAIN_DISPLAY_INFO[cap.domain] || {
      label: cap.domain,
      icon: "circle",
    };

    return (
      <TouchableOpacity
        key={cap.id}
        style={[
          styles.capabilityItem,
          cap.is_mastered && styles.capabilityMastered,
        ]}
        onPress={() => onCapabilityPress?.(cap)}
        testID={`capability-${cap.name}`}
      >
        <View style={styles.capabilityIcon}>
          {cap.is_mastered ? (
            <Feather name="check-circle" size={20} color={colors.success} />
          ) : cap.depth > 0 ? (
            <Feather name="lock" size={20} color={colors.textSecondary} />
          ) : (
            <Feather name="circle" size={20} color={colors.primary} />
          )}
        </View>

        <View style={styles.capabilityContent}>
          <Text
            style={[
              styles.capabilityName,
              cap.is_mastered && styles.capabilityNameMastered,
            ]}
          >
            {cap.display_name || cap.name}
          </Text>

          {cap.prerequisite_names.length > 0 && !cap.is_mastered && (
            <Text style={styles.prerequisiteText}>
              Requires: {cap.prerequisite_names.slice(0, 2).join(", ")}
              {cap.prerequisite_names.length > 2 &&
                ` +${cap.prerequisite_names.length - 2} more`}
            </Text>
          )}
        </View>

        {cap.depth > 0 && !cap.is_mastered && (
          <View style={styles.depthBadge}>
            <Text style={styles.depthText}>{cap.depth}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDomain = (
    domain: string,
    capabilities: LearningPathCapability[],
  ) => {
    const domainInfo = DOMAIN_DISPLAY_INFO[domain] || {
      label: domain,
      icon: "circle",
    };
    const isExpanded = expandedDomains.has(domain);
    const masteredCount = capabilities.filter((c) => c.is_mastered).length;

    return (
      <View key={domain} style={styles.domainSection}>
        <TouchableOpacity
          style={styles.domainHeader}
          onPress={() => toggleDomain(domain)}
          testID={`domain-${domain}`}
        >
          <View style={styles.domainInfo}>
            <Feather
              name={domainInfo.icon as keyof typeof Feather.glyphMap}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.domainName}>{domainInfo.label}</Text>
            <Text style={styles.domainCount}>
              ({masteredCount}/{capabilities.length})
            </Text>
          </View>
          <Feather
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.domainCapabilities}>
            {capabilities.map(renderCapability)}
          </View>
        )}
      </View>
    );
  };

  const renderLearningPath = () => {
    if (!learningPath) return null;

    // Group all capabilities by domain
    const allByDomain: Record<string, LearningPathCapability[]> = {};

    for (const cap of learningPath.learning_path) {
      if (!allByDomain[cap.domain]) {
        allByDomain[cap.domain] = [];
      }
      allByDomain[cap.domain].push(cap);
    }

    // Sort domains by number of unmastered capabilities
    const sortedDomains = Object.keys(allByDomain).sort((a, b) => {
      const unmasteredA = allByDomain[a].filter((c) => !c.is_mastered).length;
      const unmasteredB = allByDomain[b].filter((c) => !c.is_mastered).length;
      return unmasteredB - unmasteredA; // More unmastered first
    });

    return (
      <View style={styles.learningPathContainer}>
        <Text style={styles.sectionTitle}>Capabilities by Domain</Text>
        {sortedDomains.map((domain) =>
          renderDomain(domain, allByDomain[domain]),
        )}
      </View>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loadState === "idle") {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Analyze a score to see your learning path
        </Text>
      </View>
    );
  }

  if (loadState === "loading") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Building your learning path...</Text>
      </View>
    );
  }

  if (loadState === "error") {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={32} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} testID="score-curriculum">
      {renderSummary()}
      {renderLearningPath()}
    </ScrollView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
    fontSize: fontSizes.md,
    textAlign: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: "center",
    padding: spacing.xl,
  },

  // Summary
  summary: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  summaryPercent: {
    fontSize: fontSizes.xl,
    fontWeight: "bold",
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
  },
  startButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  startButtonText: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },

  // Learning Path
  learningPathContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Domain
  domainSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  domainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  domainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  domainName: {
    fontSize: fontSizes.md,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  domainCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  domainCapabilities: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Capability
  capabilityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  capabilityMastered: {
    backgroundColor: `${colors.success}10`,
  },
  capabilityIcon: {
    marginRight: spacing.sm,
  },
  capabilityContent: {
    flex: 1,
  },
  capabilityName: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  capabilityNameMastered: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  prerequisiteText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  depthBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  depthText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});

export default ScoreCurriculum;

/**
 * CapabilityDiscovery Component
 *
 * Displays capabilities discovered in an imported score.
 * Shows capabilities grouped by domain with expandable sections.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import { analyzeCapabilities } from "../services/capabilityAnalysisService";
import {
  DOMAIN_DISPLAY_INFO,
  type CapabilityAnalysisResult,
} from "../types/analysisTypes";

// ============================================================================
// Types
// ============================================================================

export interface CapabilityDiscoveryProps {
  /** MusicXML content to analyze */
  musicXml: string;
  /** Optional title for the analysis */
  title?: string;
  /** Called when user taps a capability to practice */
  onCapabilityPress?: (capabilityName: string, domain: string) => void;
  /** Called when analysis completes */
  onAnalysisComplete?: (result: CapabilityAnalysisResult) => void;
  /** Called with the list of capability names when loaded */
  onCapabilitiesLoaded?: (capabilities: string[]) => void;
  /** Custom styles */
  style?: object;
  /** Test ID */
  testID?: string;
}

interface DomainSectionProps {
  domain: string;
  capabilities: string[];
  isExpanded: boolean;
  onToggle: () => void;
  onCapabilityPress?: (capabilityName: string, domain: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCapabilityName(name: string): string {
  // Convert snake_case to Title Case
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getDomainInfo(domain: string): { label: string; icon: string } {
  return (
    DOMAIN_DISPLAY_INFO[domain] || {
      label: domain.replace(/_/g, " "),
      icon: "circle",
    }
  );
}

// ============================================================================
// Domain Section Component
// ============================================================================

function DomainSection({
  domain,
  capabilities,
  isExpanded,
  onToggle,
  onCapabilityPress,
}: DomainSectionProps): React.ReactElement {
  const { label, icon } = getDomainInfo(domain);

  return (
    <View style={styles.domainSection}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.domainHeader}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${capabilities.length} capabilities, ${isExpanded ? "collapse" : "expand"}`}
      >
        <View style={styles.domainInfo}>
          <Feather
            name={icon as keyof typeof Feather.glyphMap}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.domainLabel}>{label}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{capabilities.length}</Text>
          </View>
        </View>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.capabilityList}>
          {capabilities.map((cap) => (
            <TouchableOpacity
              key={cap}
              onPress={() => onCapabilityPress?.(cap, domain)}
              style={styles.capabilityItem}
              accessibilityRole="button"
              accessibilityLabel={`Practice ${formatCapabilityName(cap)}`}
            >
              <Feather
                name="check-circle"
                size={14}
                color={colors.success}
                style={styles.capabilityIcon}
              />
              <Text style={styles.capabilityName}>
                {formatCapabilityName(cap)}
              </Text>
              <Feather
                name="chevron-right"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Score Summary Component
// ============================================================================

interface ScoreSummaryProps {
  result: CapabilityAnalysisResult;
}

function ScoreSummary({ result }: ScoreSummaryProps): React.ReactElement {
  return (
    <View style={styles.summary}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{result.capability_count}</Text>
          <Text style={styles.summaryLabel}>Capabilities</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{result.measure_count}</Text>
          <Text style={styles.summaryLabel}>Measures</Text>
        </View>
        {result.tempo_bpm && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{result.tempo_bpm}</Text>
              <Text style={styles.summaryLabel}>BPM</Text>
            </View>
          </>
        )}
      </View>

      {result.range_analysis?.lowest_pitch && (
        <View style={styles.rangeRow}>
          <Feather name="music" size={14} color={colors.textSecondary} />
          <Text style={styles.rangeText}>
            Range: {result.range_analysis.lowest_pitch} -{" "}
            {result.range_analysis.highest_pitch}
            {result.range_analysis.range_semitones
              ? ` (${result.range_analysis.range_semitones} semitones)`
              : ""}
          </Text>
        </View>
      )}

      {result.unified_scores?.difficulty_score != null && (
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyLabel}>Difficulty:</Text>
          <View style={styles.difficultyBar}>
            <View
              style={[
                styles.difficultyFill,
                {
                  width: `${Math.min(result.unified_scores.difficulty_score * 10, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.difficultyValue}>
            {result.unified_scores.difficulty_score.toFixed(1)}/10
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CapabilityDiscovery({
  musicXml,
  title,
  onCapabilityPress,
  onAnalysisComplete,
  onCapabilitiesLoaded,
  style,
  testID,
}: CapabilityDiscoveryProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CapabilityAnalysisResult | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set(),
  );

  // Analyze on mount
  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      setIsLoading(true);
      setError(null);

      const analysisResult = await analyzeCapabilities(musicXml, { title });

      if (cancelled) return;

      if (analysisResult.success) {
        setResult(analysisResult.data);
        onAnalysisComplete?.(analysisResult.data);
        onCapabilitiesLoaded?.(analysisResult.data.capabilities);

        // Auto-expand domains with 3 or fewer capabilities
        const autoExpand = new Set<string>();
        for (const [domain, caps] of Object.entries(
          analysisResult.data.capabilities_by_domain,
        )) {
          if (Array.isArray(caps) && caps.length <= 3) {
            autoExpand.add(domain);
          }
        }
        setExpandedDomains(autoExpand);
      } else {
        setError(analysisResult.error.message);
      }

      setIsLoading(false);
    }

    analyze();

    return () => {
      cancelled = true;
    };
  }, [musicXml, title, onAnalysisComplete, onCapabilitiesLoaded]);

  // Toggle domain expansion
  const toggleDomain = useCallback((domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }, []);

  // Expand all
  const expandAll = useCallback(() => {
    if (!result) return;
    setExpandedDomains(new Set(Object.keys(result.capabilities_by_domain)));
  }, [result]);

  // Collapse all
  const collapseAll = useCallback(() => {
    setExpandedDomains(new Set());
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, style]} testID={testID}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analyzing score...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centered, style]} testID={testID}>
        <Feather name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  // No result
  if (!result) {
    return (
      <View style={[styles.container, styles.centered, style]} testID={testID}>
        <Feather name="info" size={48} color={colors.textSecondary} />
        <Text style={styles.errorTitle}>No Analysis Available</Text>
      </View>
    );
  }

  // Get sorted domains (by capability count, descending)
  const sortedDomains = Object.entries(result.capabilities_by_domain)
    .filter(([, caps]) => Array.isArray(caps) && caps.length > 0)
    .sort(([, a], [, b]) => (b as string[]).length - (a as string[]).length);

  const allExpanded =
    expandedDomains.size === sortedDomains.length && sortedDomains.length > 0;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator>
        {/* Summary */}
        <ScoreSummary result={result} />

        {/* Expand/Collapse controls */}
        <View style={styles.controls}>
          <Text style={styles.sectionTitle}>Capabilities by Category</Text>
          <TouchableOpacity
            onPress={allExpanded ? collapseAll : expandAll}
            style={styles.expandButton}
            accessibilityRole="button"
            accessibilityLabel={allExpanded ? "Collapse all" : "Expand all"}
          >
            <Text style={styles.expandButtonText}>
              {allExpanded ? "Collapse All" : "Expand All"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Domain sections */}
        {sortedDomains.map(([domain, capabilities]) => (
          <DomainSection
            key={domain}
            domain={domain}
            capabilities={capabilities as string[]}
            isExpanded={expandedDomains.has(domain)}
            onToggle={() => toggleDomain(domain)}
            onCapabilityPress={onCapabilityPress}
          />
        ))}

        {sortedDomains.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="info" size={32} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              No capabilities detected in this score.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorTitle: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  errorMessage: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Summary
  summary: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  rangeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  difficultyLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  difficultyBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  difficultyFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  difficultyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    minWidth: 44,
    textAlign: "right",
  },

  // Controls
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  expandButton: {
    padding: spacing.xs,
  },
  expandButtonText: {
    fontSize: 14,
    color: colors.primary,
  },

  // Domain section
  domainSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  domainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  domainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  domainLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },

  // Capability list
  capabilityList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  capabilityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  capabilityIcon: {
    marginRight: spacing.sm,
  },
  capabilityName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

/**
 * Tuner - Pitch detection display with needle or text mode
 *
 * Uses usePitchDetection hook for real-time pitch detection.
 * Displays current pitch with visual feedback for tuning accuracy.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path, Line, Text as SvgText, Circle } from "react-native-svg";
import { usePitchDetection } from "../../../hooks/usePitchDetection";
import { frequencyToNote, getCentsDeviation, noteToFrequency } from "../../../constants/notes";

// A4 frequency for calculations
const A4_FREQUENCY = 440;

export type TunerMode = "needle" | "text";
export type Temperament = "equal" | "just";

export interface TunerProps {
  mode?: TunerMode;
  temperament?: Temperament;
}

const Tuner = React.memo(function Tuner({
  mode = "needle",
  temperament = "equal",
}: TunerProps): React.JSX.Element {
  const [isActive, setIsActive] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [cents, setCents] = useState(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear note if no pitch detected for 300ms
  const clearNoteAfterSilence = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      setCurrentNote(null);
      setCents(0);
      setFrequency(null);
    }, 300);
  }, []);

  const handlePitchDetected = useCallback(
    (pitch: { frequency?: number } | null) => {
      if (pitch && pitch.frequency) {
        // Clear any pending silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        setFrequency(pitch.frequency);
        const note = frequencyToNote(pitch.frequency);
        setCurrentNote(note);
        // Calculate cents deviation from the target note's frequency
        const targetFreq = note ? noteToFrequency(note) : null;
        const deviation = targetFreq ? getCentsDeviation(pitch.frequency, targetFreq) : 0;
        setCents(Math.round(deviation));
        // Start silence detection timer
        clearNoteAfterSilence();
      } else {
        setCurrentNote(null);
        setCents(0);
        setFrequency(null);
      }
    },
    [clearNoteAfterSilence],
  );

  const {
    isListening,
    startListening,
    stopListening,
    error,
    permissionGranted,
  } = usePitchDetection({
    enabled: isActive,
    onPitchDetected: handlePitchDetected,
    onRealtimePitch: handlePitchDetected,
    volumeThreshold: 0.01,
  });

  const handleToggle = useCallback(async () => {
    if (isActive) {
      stopListening();
      setIsActive(false);
      setCurrentNote(null);
      setCents(0);
      setFrequency(null);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      setIsActive(true);
      await startListening();
    }
  }, [isActive, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [isListening, stopListening]);

  // Get tuning quality color
  const getTuneColor = (): string => {
    const absCents = Math.abs(cents);
    if (absCents <= 5) return "#4CAF50"; // In tune
    if (absCents <= 10) return "#8BC34A";
    if (absCents <= 20) return "#FFC107";
    if (absCents <= 35) return "#FF9800";
    return "#F44336"; // Very out of tune
  };

  // Calculate needle rotation (-50 to +50 cents = -90 to +90 degrees)
  // Returns 0 when no note is detected
  const getNeedleRotation = (): number => {
    if (!currentNote) return 0; // Return to center when no sound
    const clampedCents = Math.max(-50, Math.min(50, cents));
    return (clampedCents / 50) * 90;
  };

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <TouchableOpacity
        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
        onPress={handleToggle}
        accessibilityLabel={isActive ? "Stop tuner" : "Start tuner"}
        accessibilityRole="button"
      >
        <Text style={styles.toggleButtonIcon}>{isActive ? "🔴" : "🎤"}</Text>
        <Text style={styles.toggleButtonText}>
          {isActive ? "Stop" : "Start"}
        </Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Tuner Display */}
      {isActive && (
        <View style={styles.tunerDisplay}>
          {mode === "needle" ? (
            // Needle Mode - Semicircular gauge
            <View style={styles.needleContainer}>
              {/* Gauge arc and needle */}
              <View style={styles.gaugeArc}>
                {/* Smooth angular gradient using 180 SVG arc segments */}
                <Svg width={360} height={180} style={styles.svgContainer}>
                  {/* Arc segments - 180 segments spanning 180° to 360° (left to right through top) */}
                  {/* Center at (180, 160), fills entire semicircle from center to radius 120 */}
                  {Array.from({ length: 180 }, (_, i) => {
                    const cx = 180;
                    const cy = 160;
                    const outerR = 120;
                    const segmentAngle = 180 / 180; // 1° per segment
                    // Start at 180° (left), go through 270° (top), end at 360° (right)
                    const startAngle = 180 + i * segmentAngle;
                    const endAngle = 180 + (i + 1) * segmentAngle;
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    // Interpolate color based on position (0 to 1 across the arc)
                    const t = i / 179; // 0 at left edge, 1 at right edge
                    // Color stops: red(0) -> orange(0.2) -> yellow(0.35) -> green(0.5) -> yellow(0.65) -> orange(0.8) -> red(1)
                    const getColor = (pos: number): string => {
                      const stops = [
                        { p: 0, r: 244, g: 67, b: 54 },     // red
                        { p: 0.2, r: 255, g: 152, b: 0 },   // orange
                        { p: 0.35, r: 255, g: 193, b: 7 },  // yellow
                        { p: 0.5, r: 76, g: 175, b: 80 },   // green
                        { p: 0.65, r: 255, g: 193, b: 7 },  // yellow
                        { p: 0.8, r: 255, g: 152, b: 0 },   // orange
                        { p: 1, r: 244, g: 67, b: 54 },     // red
                      ];
                      let lower = stops[0], upper = stops[stops.length - 1];
                      for (let j = 0; j < stops.length - 1; j++) {
                        if (pos >= stops[j].p && pos <= stops[j + 1].p) {
                          lower = stops[j];
                          upper = stops[j + 1];
                          break;
                        }
                      }
                      const range = upper.p - lower.p;
                      const localT = range > 0 ? (pos - lower.p) / range : 0;
                      const r = Math.round(lower.r + (upper.r - lower.r) * localT);
                      const g = Math.round(lower.g + (upper.g - lower.g) * localT);
                      const b = Math.round(lower.b + (upper.b - lower.b) * localT);
                      return `rgb(${r},${g},${b})`;
                    };
                    
                    const color = getColor(t);
                    
                    // Pie slice: from center to outer arc
                    const x1 = cx + outerR * Math.cos(startRad);
                    const y1 = cy + outerR * Math.sin(startRad);
                    const x2 = cx + outerR * Math.cos(endRad);
                    const y2 = cy + outerR * Math.sin(endRad);
                    
                    // Path: center -> outer start -> arc -> outer end -> back to center
                    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} Z`;
                    
                    return (
                      <Path
                        key={i}
                        d={d}
                        fill={color}
                        opacity={0.7}
                      />
                    );
                  })}
                  {/* Arc outline */}
                  <Path
                    d="M 60 160 A 120 120 0 0 1 300 160"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    fill="none"
                  />
                  {/* Bottom line to complete the semicircle enclosure */}
                  <Line
                    x1={60}
                    y1={160}
                    x2={300}
                    y2={160}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  {/* Tick marks at 0, ±10, ±20, ±30, ±40, ±50 cents */}
                  {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((centsValue) => {
                    const cx = 180;
                    const cy = 160;
                    const innerR = 120; // Starts at the arc (radius 120)
                    const outerR = 134; // Extends outward
                    // Map cents to angle: 0 cents = 270° (top), ±50 cents = 180°/360°
                    const angle = 270 + (centsValue / 50) * 90;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = cx + innerR * Math.cos(rad);
                    const y1 = cy + innerR * Math.sin(rad);
                    const x2 = cx + outerR * Math.cos(rad);
                    const y2 = cy + outerR * Math.sin(rad);
                    // Make the 0 tick slightly longer
                    const tickOuterR = centsValue === 0 ? 138 : outerR;
                    const x2Final = cx + tickOuterR * Math.cos(rad);
                    const y2Final = cy + tickOuterR * Math.sin(rad);
                    // Label position outside the tick
                    const labelR = centsValue === 0 ? 152 : 148;
                    const labelX = cx + labelR * Math.cos(rad);
                    const labelY = cy + labelR * Math.sin(rad);
                    const labelText = centsValue === 0 ? "0" : (centsValue > 0 ? `+${centsValue}` : `${centsValue}`);
                    return (
                      <React.Fragment key={centsValue}>
                        <Line
                          x1={x1}
                          y1={y1}
                          x2={x2Final}
                          y2={y2Final}
                          stroke={centsValue === 0 ? "#4CAF50" : "#FFFFFF"}
                          strokeWidth={centsValue === 0 ? 4 : 1.5}
                        />
                        <SvgText
                          x={labelX}
                          y={labelY}
                          fill={centsValue === 0 ? "#4CAF50" : "#FFFFFF"}
                          fontSize={centsValue === 0 ? 16 : 12}
                          fontWeight={centsValue === 0 ? "bold" : "normal"}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {labelText}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                  {/* Small tick marks at ±5, ±15, ±25, ±35, ±45 cents (half size) */}
                  {[-45, -35, -25, -15, -5, 5, 15, 25, 35, 45].map((centsValue) => {
                    const cx = 180;
                    const cy = 160;
                    const innerR = 120;
                    const outerR = 129; // 9px length
                    const angle = 270 + (centsValue / 50) * 90;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = cx + innerR * Math.cos(rad);
                    const y1 = cy + innerR * Math.sin(rad);
                    const x2 = cx + outerR * Math.cos(rad);
                    const y2 = cy + outerR * Math.sin(rad);
                    return (
                      <Line
                        key={`small-${centsValue}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#FFFFFF"
                        strokeWidth={1.2}
                      />
                    );
                  })}
                  {/* Tiny tick marks for every degree except 0, ±5, ±10, ±15, etc. */}
                  {Array.from({ length: 101 }, (_, i) => i - 50)
                    .filter((v) => v % 5 !== 0) // Exclude multiples of 5 (already have ticks)
                    .map((centsValue) => {
                      const cx = 180;
                      const cy = 160;
                      const innerR = 120;
                      const outerR = 123; // 3px length
                      const angle = 270 + (centsValue / 50) * 90;
                      const rad = (angle * Math.PI) / 180;
                      const x1 = cx + innerR * Math.cos(rad);
                      const y1 = cy + innerR * Math.sin(rad);
                      const x2 = cx + outerR * Math.cos(rad);
                      const y2 = cy + outerR * Math.sin(rad);
                      return (
                        <Line
                          key={`tiny-${centsValue}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#FFFFFF"
                          strokeWidth={1}
                        />
                      );
                    })}
                </Svg>

                {/* Needle - rotates around bottom center */}
                <View style={styles.needlePivotBase}>
                  <View
                    style={[
                      styles.needleRotator,
                      { transform: [{ rotate: `${getNeedleRotation()}deg` }] },
                    ]}
                  >
                    <View
                      style={[
                        styles.needle,
                        { backgroundColor: "#FFFFFF" },
                      ]}
                    />
                  </View>
                  {Math.abs(cents) <= 5 && currentNote ? (
                    <View style={styles.smileyContainer}>
                      <Svg width={24} height={24}>
                        {/* Face background */}
                        <Circle cx={12} cy={12} r={11} fill="#FFD700" />
                        <Circle cx={12} cy={12} r={11} stroke="#DAA520" strokeWidth={1} fill="none" />
                        {/* Star eyes */}
                        <SvgText x={6} y={11} fontSize={8} textAnchor="middle">⭐</SvgText>
                        <SvgText x={18} y={11} fontSize={8} textAnchor="middle">⭐</SvgText>
                        {/* Smile */}
                        <Path
                          d="M 6 14 Q 12 20 18 14"
                          stroke="#333"
                          strokeWidth={2}
                          fill="none"
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>
                  ) : (
                    <View style={styles.pivotDot} />
                  )}
                </View>
              </View>

              {/* Note Display below gauge */}
              <View style={styles.noteContainer}>
                {currentNote ? (
                  <>
                    <Text style={[styles.noteName, { color: getTuneColor() }]}>
                      {currentNote}
                    </Text>
                    <Text style={styles.centsDisplay}>
                      {cents > 0 ? "+" : ""}
                      {cents} cents
                    </Text>
                  </>
                ) : (
                  <Text style={styles.micIcon}>🎤</Text>
                )}
              </View>
            </View>
          ) : (
            // Text Mode
            <View style={styles.textContainer}>
              {currentNote ? (
                <>
                  <Text style={[styles.textNote, { color: getTuneColor() }]}>
                    {currentNote}
                  </Text>
                  <Text style={[styles.textCents, { color: getTuneColor() }]}>
                    {cents > 0 ? "+" : ""}
                    {cents} cents
                  </Text>
                  <Text style={styles.textFreq}>
                    {frequency ? `${frequency.toFixed(1)} Hz` : ""}
                  </Text>
                  <Text style={styles.tuningIndicator}>
                    {Math.abs(cents) <= 5
                      ? "✓ In Tune"
                      : cents < 0
                        ? "↓ Flat"
                        : "↑ Sharp"}
                  </Text>
                </>
              ) : (
                <Text style={styles.textMicIcon}>🎤</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Temperament indicator */}
      <Text style={styles.temperamentText}>
        {temperament === "just" ? "Just Intonation" : "Equal Temperament"}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
  toggleButtonIcon: {
    fontSize: 16,
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 8,
  },

  // Tuner Display
  tunerDisplay: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },

  // Needle Mode - Gauge design
  needleContainer: {
    alignItems: "center",
    width: "100%",
  },
  // GAUGE LAYOUT - all elements share pivot at (180, 20) from container bottom
  // Container: 360x180, Pivot: centerX=180, bottomOffset=20
  // SVG draws arcs and gradient, Needle: 115
  gaugeArc: {
    width: 360,
    height: 180,
    position: "relative",
  },
  // SVG container - positioned to align with gauge
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  // Needle pivot - rotation center at (180, 20)
  // needleRotator is 230px, rotates around center (115px up from its bottom)
  // So position needlePivotBase at bottom: 20-115 = -95 to align rotation center with pivot
  needlePivotBase: {
    position: "absolute",
    bottom: -95, // Shifted so rotator center is at pivot (20px from container bottom)
    left: 174, // 180 - 6 (half of 12px width)
    width: 12,
    alignItems: "center",
  },
  // needleRotator is 2x needle height so center = needle bottom = pivot point
  needleRotator: {
    width: 12,
    height: 230, // 2x needle height (115)
    alignItems: "center",
    justifyContent: "flex-start", // Needle at top, bottom half is empty
  },
  needle: {
    width: 4,
    height: 115, // Almost reaches arc (radius 120)
    borderRadius: 2,
  },
  pivotDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#333",
    borderWidth: 2,
    borderColor: "#666",
    position: "absolute",
    bottom: 107, // At rotation center: 115 - 8 (half of dot height)
  },
  smileyContainer: {
    width: 24,
    height: 24,
    position: "absolute",
    bottom: 103, // At rotation center: 115 - 12 (half of smiley height)
    left: -6, // Center the larger smiley: (24 - 12) / 2 = -6
  },
  noteContainer: {
    alignItems: "center",
    marginTop: 8,
    minHeight: 60,
  },
  noteName: {
    fontSize: 36,
    fontWeight: "bold",
  },
  micIcon: {
    fontSize: 36,
    textShadowColor: "rgba(76, 175, 80, 1.0)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  centsDisplay: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  listeningText: {
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },

  // Text Mode
  textContainer: {
    alignItems: "center",
  },
  textNote: {
    fontSize: 48,
    fontWeight: "bold",
  },
  textMicIcon: {
    fontSize: 48,
    textShadowColor: "rgba(76, 175, 80, 1.0)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  textCents: {
    fontSize: 24,
    marginTop: 4,
  },
  textFreq: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  tuningIndicator: {
    color: "#888",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },

  // Temperament
  temperamentText: {
    color: "#444",
    fontSize: 10,
    marginTop: 8,
    textTransform: "uppercase",
  },
});

export default Tuner;

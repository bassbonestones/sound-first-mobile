/**
 * Soft Gate Help Documentation
 * Explanations for each soft gate metric shown in MaterialDetailView
 */

export const SOFT_GATE_HELP = {
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

export default SOFT_GATE_HELP;

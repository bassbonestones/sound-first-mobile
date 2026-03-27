/**
 * Constants for UserProgressionInspector component
 */

// Sub-tab configuration
export const SUB_TABS = [
  { id: "overview", label: "Overview" },
  { id: "capabilities", label: "Capabilities" },
  { id: "soft_gates", label: "Soft Gates" },
  { id: "candidates", label: "Candidates" },
] as const;

export type SubTabId = (typeof SUB_TABS)[number]["id"];

// Instrument definitions with clef assignments
export interface InstrumentDefinition {
  name: string;
  clef: "treble" | "bass";
}

export const INSTRUMENTS: InstrumentDefinition[] = [
  // Brass
  { name: "Trumpet", clef: "treble" },
  { name: "French Horn", clef: "treble" },
  { name: "Tenor Trombone", clef: "bass" },
  { name: "Bass Trombone", clef: "bass" },
  { name: "Euphonium", clef: "bass" },
  { name: "Tuba", clef: "bass" },
  // Woodwinds
  { name: "Flute", clef: "treble" },
  { name: "Clarinet", clef: "treble" },
  { name: "Oboe", clef: "treble" },
  { name: "Bassoon", clef: "bass" },
  { name: "Alto Saxophone", clef: "treble" },
  { name: "Tenor Saxophone", clef: "treble" },
  { name: "Baritone Saxophone", clef: "treble" },
  // Strings
  { name: "Violin", clef: "treble" },
  { name: "Viola", clef: "treble" },
  { name: "Cello", clef: "bass" },
  { name: "Double Bass", clef: "bass" },
  { name: "Guitar", clef: "treble" },
  // Keyboard
  { name: "Piano", clef: "treble" },
  // Voice
  { name: "Soprano", clef: "treble" },
  { name: "Alto", clef: "treble" },
  { name: "Tenor", clef: "treble" },
  { name: "Bass Voice", clef: "bass" },
  { name: "Voice (General)", clef: "treble" },
];

// Day 0 journey stages
export interface Day0Stage {
  value: number;
  label: string;
}

export const DAY0_STAGES: Day0Stage[] = [
  { value: 0, label: "0 - Not Started" },
  { value: 1, label: "1 - Resonant Note" },
  { value: 2, label: "2 - Range Finding" },
  { value: 3, label: "3 - Completed" },
];

/**
 * Instrument Data for Onboarding
 *
 * Instrument families, their instruments, and default starting notes.
 */

// Instrument families with their instruments
export const instrumentFamilies = {
  Brass: {
    icon: "🎺",
    instruments: [
      { name: "Trumpet", icon: "🎺", clef: "treble" },
      { name: "French Horn", icon: "🎵", clef: "treble" },
      { name: "Tenor Trombone", icon: "🎶", clef: "bass" },
      { name: "Bass Trombone", icon: "🎶", clef: "bass" },
      { name: "Euphonium", icon: "🎵", clef: "bass" },
      { name: "Tuba", icon: "🎵", clef: "bass" },
    ],
  },
  Woodwinds: {
    icon: "🎷",
    instruments: [
      { name: "Flute", icon: "🪈", clef: "treble" },
      { name: "Clarinet", icon: "🎵", clef: "treble" },
      { name: "Oboe", icon: "🎵", clef: "treble" },
      { name: "Bassoon", icon: "🎵", clef: "bass" },
      { name: "Alto Saxophone", icon: "🎷", clef: "treble" },
      { name: "Tenor Saxophone", icon: "🎷", clef: "treble" },
      { name: "Baritone Saxophone", icon: "🎷", clef: "treble" },
    ],
  },
  Strings: {
    icon: "🎻",
    instruments: [
      { name: "Violin", icon: "🎻", clef: "treble" },
      { name: "Viola", icon: "🎻", clef: "treble" }, // Actually alto clef but treble works
      { name: "Cello", icon: "🎻", clef: "bass" },
      { name: "Double Bass", icon: "🎻", clef: "bass" },
      { name: "Guitar", icon: "🎸", clef: "treble" },
    ],
  },
  Keyboard: {
    icon: "🎹",
    instruments: [
      { name: "Piano", icon: "🎹", clef: "treble" },
      { name: "Organ", icon: "🎹", clef: "treble" },
    ],
  },
  Voice: {
    icon: "🎤",
    instruments: [
      { name: "Soprano", icon: "🎤", clef: "treble" },
      { name: "Alto", icon: "🎤", clef: "treble" },
      { name: "Tenor", icon: "🎤", clef: "treble" },
      { name: "Bass Voice", icon: "🎤", clef: "bass" },
      { name: "Voice (General)", icon: "🎤", clef: "treble" },
    ],
  },
  Other: {
    icon: "🎼",
    instruments: [
      { name: "Mallet Percussion", icon: "🥁", clef: "treble" },
      { name: "Other", icon: "🎼", clef: "treble" },
    ],
  },
};

// Note names for reference
export const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Default starting notes by instrument (a comfortable, resonant note for that instrument)
export const instrumentDefaults = {
  Piano: { startingNote: "C4", clef: "treble" },
  Organ: { startingNote: "C4", clef: "treble" },
  Violin: { startingNote: "A4", clef: "treble" },
  Viola: { startingNote: "D4", clef: "treble" },
  Cello: { startingNote: "G3", clef: "bass" },
  "Double Bass": { startingNote: "G2", clef: "bass" },
  Flute: { startingNote: "D5", clef: "treble" },
  Oboe: { startingNote: "A4", clef: "treble" },
  Clarinet: { startingNote: "G4", clef: "treble" },
  Bassoon: { startingNote: "F3", clef: "bass" },
  "Alto Saxophone": { startingNote: "G4", clef: "treble" },
  "Tenor Saxophone": { startingNote: "D4", clef: "treble" },
  "Baritone Saxophone": { startingNote: "G3", clef: "treble" },
  Trumpet: { startingNote: "Bb4", clef: "treble" },
  "French Horn": { startingNote: "F4", clef: "treble" },
  "Tenor Trombone": { startingNote: "Bb3", clef: "bass" },
  "Bass Trombone": { startingNote: "F3", clef: "bass" },
  Euphonium: { startingNote: "Bb3", clef: "bass" },
  Tuba: { startingNote: "F2", clef: "bass" },
  Soprano: { startingNote: "A4", clef: "treble" },
  Alto: { startingNote: "E4", clef: "treble" },
  Tenor: { startingNote: "A3", clef: "treble" },
  "Bass Voice": { startingNote: "E3", clef: "bass" },
  "Voice (General)": { startingNote: "E4", clef: "treble" },
  Guitar: { startingNote: "G3", clef: "treble" },
  "Mallet Percussion": { startingNote: "C4", clef: "treble" },
  Other: { startingNote: "C4", clef: "treble" },
};

/**
 * Get the clef for a given instrument
 */
export function getClefForInstrument(
  instrument: string | undefined | null,
  selectedFamily: string | undefined | null,
): string {
  if (!selectedFamily || !instrument) return "treble";
  const family =
    instrumentFamilies[selectedFamily as keyof typeof instrumentFamilies];
  if (!family)
    return (
      instrumentDefaults[instrument as keyof typeof instrumentDefaults]?.clef ||
      "treble"
    );
  const inst = family.instruments.find((i) => i.name === instrument);
  return (
    inst?.clef ||
    instrumentDefaults[instrument as keyof typeof instrumentDefaults]?.clef ||
    "treble"
  );
}

/**
 * Get the icon for a given instrument
 */
export function getIconForInstrument(
  instrument: string | undefined | null,
  selectedFamily: string | undefined | null,
): string {
  if (!selectedFamily || !instrument) return "🎵";
  const family =
    instrumentFamilies[selectedFamily as keyof typeof instrumentFamilies];
  if (!family) return "🎵";
  const inst = family.instruments.find((i) => i.name === instrument);
  return inst?.icon || "🎵";
}

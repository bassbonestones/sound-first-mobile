/**
 * Instrument Constants
 *
 * Instrument families, individual instruments, and their default settings.
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

// Default starting notes by instrument (a comfortable, resonant note)
export const instrumentDefaults = {
  // Keyboard
  Piano: { startingNote: "C4", clef: "treble" },
  Organ: { startingNote: "C4", clef: "treble" },

  // Strings
  Violin: { startingNote: "A4", clef: "treble" },
  Viola: { startingNote: "D4", clef: "treble" },
  Cello: { startingNote: "G3", clef: "bass" },
  "Double Bass": { startingNote: "G2", clef: "bass" },
  Guitar: { startingNote: "G3", clef: "treble" },

  // Woodwinds
  Flute: { startingNote: "D5", clef: "treble" },
  Oboe: { startingNote: "A4", clef: "treble" },
  Clarinet: { startingNote: "G4", clef: "treble" },
  Bassoon: { startingNote: "F3", clef: "bass" },
  "Alto Saxophone": { startingNote: "G4", clef: "treble" },
  "Tenor Saxophone": { startingNote: "D4", clef: "treble" },
  "Baritone Saxophone": { startingNote: "G3", clef: "treble" },

  // Brass
  Trumpet: { startingNote: "Bb4", clef: "treble" },
  "French Horn": { startingNote: "F4", clef: "treble" },
  "Tenor Trombone": { startingNote: "Bb3", clef: "bass" },
  "Bass Trombone": { startingNote: "F3", clef: "bass" },
  Euphonium: { startingNote: "Bb3", clef: "bass" },
  Tuba: { startingNote: "F2", clef: "bass" },

  // Voice
  Soprano: { startingNote: "A4", clef: "treble" },
  Alto: { startingNote: "E4", clef: "treble" },
  Tenor: { startingNote: "A3", clef: "treble" },
  "Bass Voice": { startingNote: "E3", clef: "bass" },
  "Voice (General)": { startingNote: "E4", clef: "treble" },

  // Other
  "Mallet Percussion": { startingNote: "C4", clef: "treble" },
  Other: { startingNote: "C4", clef: "treble" },
};

/**
 * Get all instruments as a flat array
 */
export function getAllInstruments() {
  const instruments = [];
  Object.values(instrumentFamilies).forEach((family) => {
    instruments.push(...family.instruments);
  });
  return instruments;
}

/**
 * Get instrument by name
 */
export function getInstrument(name) {
  for (const family of Object.values(instrumentFamilies)) {
    const instrument = family.instruments.find((i) => i.name === name);
    if (instrument) return instrument;
  }
  return null;
}

/**
 * Get family name for an instrument
 */
export function getInstrumentFamily(instrumentName) {
  for (const [familyName, family] of Object.entries(instrumentFamilies)) {
    if (family.instruments.some((i) => i.name === instrumentName)) {
      return familyName;
    }
  }
  return null;
}

export default instrumentFamilies;

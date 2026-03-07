/**
 * Instrument to clef mapping
 */
export const INSTRUMENT_CLEFS = {
  piano: "both",
  trumpet: "treble",
  trombone: "bass",
  "bass trombone": "bass",
  "tenor trombone": "bass",
  "french horn": "treble",
  tuba: "bass",
  flute: "treble",
  clarinet: "treble",
  oboe: "treble",
  bassoon: "bass",
  saxophone: "treble",
  violin: "treble",
  viola: "alto",
  cello: "bass",
  voice: "treble",
};

/**
 * Bass clef instruments list
 */
export const BASS_CLEF_INSTRUMENTS = [
  "Trombone",
  "Bass Trombone",
  "Tuba",
  "Euphonium",
  "Baritone",
  "Cello",
  "Double Bass",
  "Bassoon",
  "Bass Guitar",
];

/**
 * Get the clef type for an instrument
 * @param {string} instrument - The instrument name
 * @returns {string} The clef type (treble, bass, both, or alto)
 */
export function getClefForInstrument(instrument) {
  return INSTRUMENT_CLEFS[instrument?.toLowerCase()] || "treble";
}

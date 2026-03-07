/**
 * Parse note name to get components
 * @param {string} note - Note name like "Bb3", "C#4"
 * @returns {Object} Parsed note components
 */
export function parseNoteName(note) {
  if (!note) return { letter: "C", accidental: "", octave: 4 };
  const match = note.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return { letter: "C", accidental: "", octave: 4 };
  return {
    letter: match[1].toUpperCase(),
    accidental: match[2] === "#" ? "♯" : match[2] === "b" ? "♭" : "",
    rawAccidental: match[2], // Keep raw 'b' or '#' for MusicXML
    octave: parseInt(match[3], 10),
    hasAccidental: match[2] !== "",
  };
}

/**
 * Convert note name to MusicXML pitch representation
 * @param {string} noteName - Note name like "Bb3"
 * @returns {Object} MusicXML pitch object with step, octave, alter
 */
export function noteToMusicXMLPitch(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return { step: "C", octave: 4, alter: 0 };

  let alter = 0;
  if (parsed.rawAccidental === "b") {
    alter = -1;
  } else if (parsed.rawAccidental === "#") {
    alter = 1;
  }

  return { step: parsed.letter, octave: parsed.octave, alter };
}

/**
 * Generate MusicXML for a single note on a staff
 * @param {string} noteName - Note name like "Bb3"
 * @param {string} clef - Clef type: "treble" or "bass"
 * @returns {string} MusicXML content
 */
export function generateSingleNoteMusicXML(noteName, clef = "treble") {
  const pitch = noteToMusicXMLPitch(noteName);
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";

  const alterXML =
    pitch.alter !== 0 ? `        <alter>${pitch.alter}</alter>\n` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name></part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time symbol="common">
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>${pitch.step}</step>
${alterXML}          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
      <barline location="right">
        <bar-style>light-light</bar-style>
      </barline>
    </measure>
  </part>
</score-partwise>`;
}

/**
 * Convert note name to frequency (e.g., "Bb3" -> 233.08 Hz)
 * @param {string} noteName - Note name like "Bb3", "A4"
 * @returns {number} Frequency in Hz
 */
export function noteToFrequency(noteName) {
  // Parse note name
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d+)$/);
  if (!match) return 440; // Default A4

  const [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Semitones from C
  const noteMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let semitone = noteMap[letter.toUpperCase()] || 0;

  if (accidental === "#") semitone += 1;
  else if (accidental === "b") semitone -= 1;

  // MIDI note number (C4 = 60)
  const midi = (octave + 1) * 12 + semitone;

  // Frequency: A4 (MIDI 69) = 440 Hz
  return 440 * Math.pow(2, (midi - 69) / 12);
}

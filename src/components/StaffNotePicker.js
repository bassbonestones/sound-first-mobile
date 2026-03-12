import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import NotationDisplay from "./NotationDisplay";
import {
  parseNoteName,
  noteToMidi,
  midiToNote,
  FLAT_EQUIVALENTS,
  SHARP_EQUIVALENTS,
} from "../screens/Session/components/exercises/shared";

/**
 * StaffNotePicker - Visual staff-based note selection using real MusicXML rendering
 *
 * Shows a musical staff with a movable note using OpenSheetMusicDisplay.
 * User can:
 * 1. Tap up/down arrows to move the note chromatically
 * 2. Use +/- buttons to change octave
 * 3. Use "I'll play it" mode to detect pitch from microphone
 *
 * Props:
 * - clef: "treble" | "bass" (determines which clef to show)
 * - value: Current note name (e.g., "Bb3")
 * - onChange: Callback when note changes
 * - onPlayToSelect: Callback to enable microphone pitch detection
 * - instrument: Instrument name for context
 */

// Get both enharmonic names for display
function getEnharmonicDisplay(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return noteName;

  const base = parsed.letter + parsed.accidental;
  const octave = parsed.octave;

  // Check if it has an enharmonic equivalent
  if (FLAT_EQUIVALENTS[base]) {
    // It's a sharp, show both: "C#/Db"
    return `${base}${octave} / ${FLAT_EQUIVALENTS[base]}${octave}`;
  } else if (SHARP_EQUIVALENTS[base]) {
    // It's a flat, show both: "Db/C#"
    return `${base}${octave} / ${SHARP_EQUIVALENTS[base]}${octave}`;
  }
  // Natural note, just return as-is
  return noteName;
}

// Convert note name to MusicXML pitch representation
function noteToMusicXMLPitch(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return { step: "C", octave: 4, alter: 0 };

  // Handle flats: convert to natural letter with alter=-1
  // Handle sharps: convert to natural letter with alter=1
  let step = parsed.letter;
  let alter = 0;

  if (parsed.accidental === "b") {
    alter = -1;
  } else if (parsed.accidental === "#") {
    alter = 1;
  }

  return { step, octave: parsed.octave, alter };
}

// Generate MusicXML for a single note on a staff
function generateSingleNoteMusicXML(noteName, clef = "treble") {
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

export default function StaffNotePicker({
  clef = "treble",
  value,
  onChange,
  onPlayToSelect,
  instrument = "",
}) {
  const [currentNote, setCurrentNote] = useState(
    value || (clef === "bass" ? "F3" : "G4"),
  );

  useEffect(() => {
    if (value && value !== currentNote) {
      setCurrentNote(value);
    }
  }, [value]);

  // Generate MusicXML for current note
  const musicxml = useMemo(() => {
    return generateSingleNoteMusicXML(currentNote, clef);
  }, [currentNote, clef]);

  const moveNote = useCallback(
    (direction) => {
      // direction: 1 = up (semitone), -1 = down (semitone)
      const midi = noteToMidi(currentNote);
      const newMidi = Math.max(24, Math.min(96, midi + direction)); // C1 to C7
      const newNote = midiToNote(newMidi, true); // Prefer flats for brass
      setCurrentNote(newNote);
      onChange?.(newNote);
    },
    [currentNote, onChange],
  );

  const changeOctave = useCallback(
    (direction) => {
      const midi = noteToMidi(currentNote);
      const newMidi = Math.max(24, Math.min(96, midi + direction * 12));
      const newNote = midiToNote(newMidi, true);
      setCurrentNote(newNote);
      onChange?.(newNote);
    },
    [currentNote, onChange],
  );

  return (
    <View style={styles.container}>
      {/* Mode Toggle - Play to Select */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          onPress={onPlayToSelect}
          style={styles.playToSelectButton}
          accessibilityLabel="Use microphone to select note by playing"
          accessibilityRole="button"
        >
          <Text style={styles.playToSelectText}>🎤 I'll play it instead</Text>
        </TouchableOpacity>
      </View>

      {/* Staff with notation display and navigation controls */}
      <View style={styles.staffWrapper}>
        {/* Up button */}
        <TouchableOpacity
          onPress={() => moveNote(1)}
          style={styles.arrowButton}
          accessibilityLabel="Move note up one semitone"
          accessibilityRole="button"
        >
          <Text style={styles.arrowText}>▲</Text>
        </TouchableOpacity>

        {/* MusicXML Notation Display - fixed size container */}
        <View style={styles.notationContainer}>
          <View style={styles.notationInner}>
            <NotationDisplay
              musicxml={musicxml}
              width={240}
              height={400}
              showTitle={false}
            />
          </View>
        </View>

        {/* Down button */}
        <TouchableOpacity
          onPress={() => moveNote(-1)}
          style={styles.arrowButton}
          accessibilityLabel="Move note down one semitone"
          accessibilityRole="button"
        >
          <Text style={styles.arrowText}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Note Name Display with Octave Controls */}
      <View style={styles.noteNameContainer}>
        <TouchableOpacity
          onPress={() => changeOctave(-1)}
          style={styles.octaveButton}
          accessibilityLabel="Decrease octave"
          accessibilityRole="button"
        >
          <Text style={styles.octaveText}>−</Text>
        </TouchableOpacity>
        <View style={styles.noteNameBox}>>
          <Text style={styles.noteName}>
            {getEnharmonicDisplay(currentNote)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => changeOctave(1)}
          style={styles.octaveButton}
          accessibilityLabel="Increase octave"
          accessibilityRole="button"
        >
          <Text style={styles.octaveText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Use arrows to move, +/- to change octave</Text>
    </View>
  );
}

StaffNotePicker.propTypes = {
  clef: PropTypes.oneOf(["treble", "bass"]),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onPlayToSelect: PropTypes.func,
  instrument: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 16,
  },
  modeToggle: {
    marginBottom: 16,
  },
  playToSelectButton: {
    backgroundColor: "#2a1f12",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#bfa76a",
  },
  playToSelectText: {
    color: "#e6cfa7",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  staffWrapper: {
    alignItems: "center",
    gap: 8,
    width: 280,
  },
  notationContainer: {
    width: 260,
    height: 420,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#bfa76a",
    backgroundColor: "#fffbe6",
    justifyContent: "center",
    alignItems: "center",
  },
  notationInner: {
    width: 240,
    height: 400,
    overflow: "hidden",
  },
  arrowButton: {
    backgroundColor: "#3b2c1a",
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfa76a",
  },
  arrowText: {
    fontSize: 24,
    color: "#FFD700",
  },
  noteNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  noteNameBox: {
    backgroundColor: "#3b2c1a",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#FFD700",
    minWidth: 160,
    alignItems: "center",
  },
  noteName: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    textAlign: "center",
  },
  octaveButton: {
    backgroundColor: "#3b2c1a",
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#bfa76a",
  },
  octaveText: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
  },
  hint: {
    color: "#bfa76a",
    fontSize: 12,
    marginTop: 8,
  },
});

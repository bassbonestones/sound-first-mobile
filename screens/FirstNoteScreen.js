import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import AudioInput from "../components/AudioInput";
import VolumeBar, { CircularVolumeIndicator } from "../components/VolumeBar";
import EDMVisualizer from "../components/EDMVisualizer";
import NotationDisplay from "../components/NotationDisplay";
import { CommonActions } from "@react-navigation/native";

// Dev Navigation Menu for testing - jump to any stage/substep
function DevNavMenu({ stage, setStage, setSubStep, setFocusCardIndex, setFocusStepsDone, setFocusCardRatings, setPitchAccuracy, userId, navigation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const performReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`${getBackendUrl()}/users/${userId}/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Onboarding" }],
        })
      );
    } catch (err) {
      console.error("Reset error:", err);
      if (Platform.OS === "web") {
        alert("Failed to reset: " + err.message);
      }
    } finally {
      setIsResetting(false);
    }
  };
  
  const handleReset = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Reset all progress and start over?")) {
        performReset();
      }
    }
  };
  
  const STAGE_TREE = [
    {
      id: -1,
      name: "Settings",
      isSettings: true,
      subSteps: [
        { id: 0, name: "a) Instrument Class", screen: "Onboarding", params: { step: 1, clearFamily: true } },
        { id: 1, name: "b) Instrument", screen: "Onboarding", params: { step: 1 } },
        { id: 2, name: "c) First Note Picker", screen: "Onboarding", params: { step: 2 } },
      ]
    },
    { 
      id: 0, 
      name: "Listen & Sing", 
      subSteps: [
        { id: 0, name: "a) Listen" },
        { id: 1, name: "b) Sing" },
        { id: 2, name: "c) Imagine" },
      ]
    },
    { 
      id: 1, 
      name: "Play Your Note", 
      subSteps: [
        { id: 0, name: "a) Imagine intro" },
        { id: 1, name: "b) Ready to play" },
        { id: 2, name: "c) Playing" },
        { id: 3, name: "d) Rating" },
      ]
    },
    { 
      id: 2, 
      name: "Refine Your Sound", 
      subSteps: [
        { id: 0, name: "a) Focus Card 1/3", focusCardIndex: 0 },
        { id: 1, name: "b) Focus Card 2/3", focusCardIndex: 1 },
        { id: 2, name: "c) Focus Card 3/3", focusCardIndex: 2 },
        { id: 3, name: "d) All Complete", focusCardIndex: 0, ratings: [4, 4, 4] },
      ]
    },
    { 
      id: 3, 
      name: "The Musical Staff", 
      subSteps: [
        { id: 0, name: "a) Staff intro" },
        { id: 1, name: "b) Fun fact" },
      ]
    },
    { 
      id: 4, 
      name: "Your Clef", 
      subSteps: [
        { id: 0, name: "a) Clef intro" },
        { id: 1, name: "b) Clef details" },
      ]
    },
    { 
      id: 5, 
      name: "Sharps & Flats", 
      subSteps: [
        { id: 0, name: "a) Intro" },
        { id: 1, name: "b) Your note" },
      ]
    },
    { 
      id: 6, 
      name: "Note on Staff", 
      subSteps: []
    },
  ];
  
  const navigateTo = (stageId, subStepData) => {
    // Handle Settings items - navigate to Onboarding screen
    if (subStepData.screen) {
      setIsOpen(false);
      setExpandedStage(null);
      navigation.replace(subStepData.screen, subStepData.params || {});
      return;
    }
    
    // Reset common state
    setPitchAccuracy(null);
    setFocusStepsDone({ listen: false, sing: false, imagine: false, play: false });
    
    // Handle Stage 2 (Focus Cards) specially
    if (stageId === 2) {
      if (subStepData.ratings) {
        // Jump to "All Complete" state
        setFocusCardRatings(subStepData.ratings);
        setFocusCardIndex(0);
      } else {
        setFocusCardIndex(subStepData.focusCardIndex || 0);
        setFocusCardRatings([]);
      }
      setSubStep(0);
    } else {
      // Regular stage navigation
      setFocusCardIndex(0);
      setFocusCardRatings([]);
      setSubStep(subStepData.id);
    }
    
    setStage(stageId);
    setIsOpen(false);
    setExpandedStage(null);
  };
  
  if (!isOpen) {
    return (
      <TouchableOpacity
        style={devStyles.menuButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={devStyles.menuButtonText}>🔧</Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={devStyles.menuOverlay}>
      <View style={devStyles.menuContainer}>
        <View style={devStyles.menuHeader}>
          <Text style={devStyles.menuTitle}>Dev Navigation</Text>
          <TouchableOpacity onPress={() => { setIsOpen(false); setExpandedStage(null); }}>
            <Text style={devStyles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={devStyles.menuScroll}>
          {STAGE_TREE.map((stageItem) => (
            <View key={stageItem.id}>
              <TouchableOpacity
                style={[
                  devStyles.stageRow,
                  stageItem.isSettings && devStyles.settingsRow,
                  stage === stageItem.id && !stageItem.isSettings && devStyles.stageRowActive
                ]}
                onPress={() => {
                  if (stageItem.subSteps.length === 0) {
                    navigateTo(stageItem.id, { id: 0 });
                  } else {
                    setExpandedStage(expandedStage === stageItem.id ? null : stageItem.id);
                  }
                }}
              >
                <Text style={devStyles.stageIcon}>
                  {stageItem.subSteps.length > 0 
                    ? (expandedStage === stageItem.id ? "▼" : "▶") 
                    : "•"}
                </Text>
                <Text style={[
                  devStyles.stageName,
                  stageItem.isSettings && devStyles.settingsName,
                  stage === stageItem.id && !stageItem.isSettings && devStyles.stageNameActive
                ]}>
                  {stageItem.isSettings ? `⚙️ ${stageItem.name}` : `${stageItem.id}: ${stageItem.name}`}
                </Text>
              </TouchableOpacity>
              
              {expandedStage === stageItem.id && stageItem.subSteps.map((subStep) => (
                <TouchableOpacity
                  key={subStep.id}
                  style={[devStyles.subStepRow, stageItem.isSettings && devStyles.settingsSubStep]}
                  onPress={() => navigateTo(stageItem.id, subStep)}
                >
                  <Text style={devStyles.subStepName}>└ {subStep.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={[devStyles.resetButton, isResetting && { opacity: 0.6 }]}
          onPress={handleReset}
          disabled={isResetting}
        >
          <Text style={devStyles.resetButtonText}>
            {isResetting ? "Resetting..." : "🔄 Reset User Data"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const devStyles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
    zIndex: 1000,
  },
  menuButtonText: {
    fontSize: 24,
  },
  menuOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  menuContainer: {
    backgroundColor: "#1a1410",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderBottomWidth: 0,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
  },
  closeButton: {
    fontSize: 20,
    color: "#FFD700",
    padding: 5,
  },
  menuScroll: {
    maxHeight: 350,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a1f15",
  },
  stageRowActive: {
    backgroundColor: "#2a1f15",
  },
  stageIcon: {
    fontSize: 12,
    color: "#FFD700",
    width: 20,
  },
  stageName: {
    fontSize: 16,
    color: "#fffbe6",
  },
  stageNameActive: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  subStepRow: {
    paddingVertical: 10,
    paddingLeft: 40,
    paddingRight: 16,
    backgroundColor: "#0d0a07",
  },
  subStepName: {
    fontSize: 14,
    color: "#a09080",
  },
  resetButton: {
    margin: 16,
    padding: 12,
    backgroundColor: "#8B0000",
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  settingsRow: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    backgroundColor: "#1a1410",
  },
  settingsName: {
    color: "#a09080",
    fontSize: 14,
  },
  settingsSubStep: {
    backgroundColor: "#151210",
  },
});

/*
 * FirstNoteScreen - Day 0 First-Note Experience
 * 
 * A deterministic onboarding flow for brand new users to play their first note.
 * 
 * Stages:
 * 0: Listen to their note, then sing it
 * 1: Imagine the note, then play it (with pitch detection)
 * 2: Focus card practice iterations (Resonance, Projection, Core Sound)
 * 3: Learn what a staff is
 * 4: Learn what their clef is
 * 5: Learn sharps and flats
 * 6: See their note on the staff
 * 
 * Navigation params:
 * - userId: User's ID
 * - resonantNote: User's chosen resonant note (e.g., "Bb3")
 * - instrument: User's instrument (e.g., "trombone")
 */

// Focus cards for Stage 2 iterations
const DAY0_FOCUS_CARDS = [
  {
    name: "Resonant Ring",
    description: "Focus on the natural overtones and ring in your sound.",
    cue: "Listen for the ring in your sound—the overtones that bloom after the attack.",
  },
  {
    name: "Projection Intent",
    description: "Focus on directing sound outward to a specific point in space.",
    cue: "Aim your sound at a point beyond the room.",
  },
  {
    name: "Core Sound",
    description: "Focus on the fundamental, centered tone at the heart of your sound.",
    cue: "Find the core—the centered, fundamental tone.",
  },
];

// Instrument to clef mapping
const INSTRUMENT_CLEFS = {
  "piano": "both",
  "trumpet": "treble",
  "trombone": "bass",
  "bass trombone": "bass",
  "tenor trombone": "bass",
  "french horn": "treble",
  "tuba": "bass",
  "flute": "treble",
  "clarinet": "treble",
  "oboe": "treble",
  "bassoon": "bass",
  "saxophone": "treble",
  "violin": "treble",
  "viola": "alto",
  "cello": "bass",
  "voice": "treble",
};

// Bass clef instruments list
const BASS_CLEF_INSTRUMENTS = [
  "Trombone", "Bass Trombone", "Tuba", "Euphonium", "Baritone",
  "Cello", "Double Bass", "Bassoon", "Bass Guitar"
];

function getBackendUrl() {
  const LOCAL_IP = "192.168.1.118";
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IP}:8000`;
  } else if (Platform.OS === "web") {
    return `http://${window.location.hostname}:8000`;
  }
  return `http://${LOCAL_IP}:8000`;
}

// Parse note name to get components
function parseNoteName(note) {
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

// Convert note name to MusicXML pitch representation
function noteToMusicXMLPitch(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return { step: 'C', octave: 4, alter: 0 };
  
  let alter = 0;
  if (parsed.rawAccidental === 'b') {
    alter = -1;
  } else if (parsed.rawAccidental === '#') {
    alter = 1;
  }
  
  return { step: parsed.letter, octave: parsed.octave, alter };
}

// Generate MusicXML for a single note on a staff
function generateSingleNoteMusicXML(noteName, clef = 'treble') {
  const pitch = noteToMusicXMLPitch(noteName);
  const clefSign = clef === 'bass' ? 'F' : 'G';
  const clefLine = clef === 'bass' ? '4' : '2';
  
  const alterXML = pitch.alter !== 0 
    ? `        <alter>${pitch.alter}</alter>\n` 
    : '';
  
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

export default function FirstNoteScreen({ navigation, route }) {
  const { userId = 1, resonantNote = "Bb3", instrument = "trombone" } = route?.params || {};
  
  // Core state
  const [stage, setStage] = useState(0);
  const [subStep, setSubStep] = useState(0); // Sub-step within a stage
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0);
  const [pitchAccuracy, setPitchAccuracy] = useState(null); // "correct" | "off" | "listening"
  const [playCount, setPlayCount] = useState(0);
  const [focusCardIndex, setFocusCardIndex] = useState(0);
  const [focusCardRatings, setFocusCardRatings] = useState([]); // Ratings for each focus card
  const [focusStepsDone, setFocusStepsDone] = useState({ listen: false, sing: false, imagine: false, play: false });
  const [focusActiveStep, setFocusActiveStep] = useState(0); // 0=Listen, 1=Sing, 2=Imagine, 3=Play
  const [showHeardItButton, setShowHeardItButton] = useState(false);
  const [rating, setRating] = useState(null); // 1-5 rating after playing
  
  // Rating faces - 5 is star eyes
  const RATING_FACES = [
    { value: 1, emoji: "😫", label: "Struggling" },
    { value: 2, emoji: "😕", label: "Uncertain" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "😊", label: "Good" },
    { value: 5, emoji: "🤩", label: "Great!" },
  ];
  
  // Refs
  const audioRef = useRef(null);
  const heardItTimerRef = useRef(null);
  const gotCorrectPitchRef = useRef(false);
  const focusListenStartedRef = useRef(false);
  
  const noteInfo = parseNoteName(resonantNote);
  const clefType = INSTRUMENT_CLEFS[instrument.toLowerCase()] || "treble";
  
  // Generate MusicXML for Stage 6 notation display
  const stage6MusicXML = useMemo(() => {
    return generateSingleNoteMusicXML(resonantNote, clefType);
  }, [resonantNote, clefType]);
  
  // Play the user's resonant note
  const playNote = useCallback(async () => {
    if (Platform.OS !== "web") {
      setError("Audio playback is only supported on web currently");
      return;
    }
    
    try {
      setIsPlaying(true);
      
      // Show "I heard it" button after 2 seconds
      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
      heardItTimerRef.current = setTimeout(() => {
        setShowHeardItButton(true);
      }, 2000);
      
      const url = `${getBackendUrl()}/audio/note/${encodeURIComponent(resonantNote)}?instrument=${encodeURIComponent(instrument)}&duration=4`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setPlayCount(prev => prev + 1);
        setShowHeardItButton(true); // Also show when audio ends naturally
      });
      
      audio.addEventListener("error", () => {
        setError("Failed to play note audio");
        setIsPlaying(false);
        if (heardItTimerRef.current) {
          clearTimeout(heardItTimerRef.current);
        }
      });
      
      await audio.play();
    } catch (err) {
      setError(`Audio error: ${err.message}`);
      setIsPlaying(false);
      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
    }
  }, [resonantNote, instrument]);
  
  // Stop any playing audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
    };
  }, [stopAudio]);
  
  // Reset "I heard it" button and rating when stage or subStep changes
  useEffect(() => {
    setShowHeardItButton(false);
    setRating(null);
    if (heardItTimerRef.current) {
      clearTimeout(heardItTimerRef.current);
    }
  }, [stage, subStep]);
  
  // Mark Focus Card listen step as done when audio ends
  useEffect(() => {
    if (stage === 2 && focusListenStartedRef.current && !isPlaying) {
      setFocusStepsDone(prev => ({ ...prev, listen: true }));
      focusListenStartedRef.current = false;
    }
  }, [stage, isPlaying]);
  
  // Handle successful pitch match
  const handlePitchMatch = useCallback((isMatch, noteInfo) => {
    setPitchAccuracy(isMatch ? "correct" : "off");
    if (isMatch) {
      gotCorrectPitchRef.current = true;
    }
  }, []);
  
  // Handle sound end (for advancing after they play in Stage 1)
  const handleSoundEnd = useCallback(() => {
    if (stage === 1 && subStep === 2) {
      // Just finished playing in stage 1 - show rating
      setSubStep(3);
      gotCorrectPitchRef.current = false; // Reset for next attempt
    }
  }, [stage, subStep]);
  
  // Save progress to backend
  const saveProgress = useCallback(async (newStage) => {
    try {
      await fetch(`${getBackendUrl()}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day0_stage: newStage }),
      });
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  }, [userId]);
  
  // Complete Day 0
  const completeDay0 = useCallback(async () => {
    try {
      await fetch(`${getBackendUrl()}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day0_completed: true, day0_stage: 7 }),
      });
      navigation.replace("StartPractice");
    } catch (err) {
      console.error("Failed to complete Day 0:", err);
      navigation.replace("StartPractice");
    }
  }, [userId, navigation]);
  
  // Advance to next stage
  const nextStage = () => {
    const newStage = stage + 1;
    setStage(newStage);
    // Skip imagine step in Stage 1 since user just imagined in Stage 0
    setSubStep(newStage === 1 ? 2 : 0);
    setFocusCardIndex(0);
    setFocusCardRatings([]);
    setFocusStepsDone({ listen: false, sing: false, imagine: false, play: false });
    setPitchAccuracy(null);
    saveProgress(newStage);
  };
  
  // ========================================
  // STAGE 0: Listen and Sing
  // ========================================
  const renderStage0 = () => (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Let's Start With Your Note</Text>
      <Text style={styles.noteDisplay}>
        {noteInfo.letter}{noteInfo.accidental}{noteInfo.octave}
      </Text>
      
      {subStep === 0 && (
        <>
          <Text style={styles.instruction}>
            Tap Play to hear your note, then confirm when you've heard it.
          </Text>
          
          <TouchableOpacity
            style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
            onPress={playNote}
            disabled={isPlaying}
          >
            <Text style={styles.primaryButtonText}>
              {isPlaying ? "🔊 Playing..." : "▶️ Play"}
            </Text>
          </TouchableOpacity>
          
          {showHeardItButton && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                stopAudio();
                setSubStep(1);
              }}
            >
              <Text style={styles.secondaryButtonText}>I Heard It →</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      
      {subStep === 1 && (
        <View style={styles.playScreenContainer}>
          <View style={styles.playScreenContent}>
            <Text style={styles.instruction}>
              Now sing that note using an "Oh" sound.{"\n"}Match the pitch you just heard.
            </Text>
            <EDMVisualizer
              volume={volume}
              pitchAccuracy="listening"
            />
            <AudioInput
              enabled={true}
              onVolumeChange={setVolume}
              volumeThreshold={0.1}
            />
            <Text style={styles.hint}>
              Sing "Ohhhhh" and hold (like a sigh).
            </Text>
          </View>
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setSubStep(2)}
            >
              <Text style={styles.primaryButtonText}>Done Singing →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {subStep === 2 && (
        <>
          <Text style={styles.instruction}>
            Great! Now imagine that note clearly in your head.{'\n\n'}
            Hear it in your instrument's sound—with resonance and projection.
          </Text>
          <CircularVolumeIndicator volume={0.3} pitchAccuracy="listening" size={120} />
          <Text style={styles.hint}>Take a few seconds to really hear it internally...</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={playNote}>
              <Text style={styles.secondaryButtonText}>Listen Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setSubStep(1)}>
              <Text style={styles.secondaryButtonText}>Sing Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
              <Text style={styles.primaryButtonText}>Play →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
  
  // ========================================
  // STAGE 1: Imagine and Play
  // ========================================
  const renderStage1 = () => (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Play Your Note</Text>
      <Text style={styles.noteDisplay}>
        {noteInfo.letter}{noteInfo.accidental}{noteInfo.octave}
      </Text>
      
      {subStep === 0 && (
        <>
          <Text style={styles.instruction}>
            Imagine the note clearly in your head first.{'\n'}
            When you're ready, play it on your {instrument}.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setSubStep(1)}
          >
            <Text style={styles.primaryButtonText}>I'm imagining it...</Text>
          </TouchableOpacity>
        </>
      )}
      
      {subStep === 1 && (
        <>
          <Text style={styles.instruction}>
            Now play {noteInfo.letter}{noteInfo.accidental} on your {instrument}.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setSubStep(2)}
          >
            <Text style={styles.primaryButtonText}>▶️ I'm ready to play</Text>
          </TouchableOpacity>
        </>
      )}
      
      {subStep === 2 && (
        <View style={styles.playScreenContainer}>
          <View style={styles.playScreenContent}>
            <Text style={styles.instruction}>
              Play {noteInfo.letter}{noteInfo.accidental} on your {instrument}!
            </Text>
            <EDMVisualizer
              volume={volume}
              pitchAccuracy={pitchAccuracy}
            />
            <AudioInput
              enabled={true}
              targetNote={resonantNote}
              onVolumeChange={setVolume}
              onPitchMatch={handlePitchMatch}
              volumeThreshold={0.03}
              pitchMargin={50}
            />
            <View style={styles.feedbackContainer}>
              {pitchAccuracy === "correct" && (
                <Text style={styles.successText}>✓ Correct Note!</Text>
              )}
              {pitchAccuracy === "off" && volume > 0.05 && (
                <Text style={styles.warningText}>Adjust your pitch a bit</Text>
              )}
            </View>
          </View>
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSoundEnd}
            >
              <Text style={styles.primaryButtonText}>Done Playing →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {subStep === 3 && !rating && (
        <>
          <Text style={styles.instruction}>
            How did that feel?
          </Text>
          <View style={styles.ratingContainer}>
            {RATING_FACES.map((face) => (
              <TouchableOpacity
                key={face.value}
                style={styles.ratingButton}
                onPress={() => setRating(face.value)}
              >
                <Text style={styles.ratingEmoji}>{face.emoji}</Text>
                <Text style={styles.ratingLabel}>{face.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      
      {subStep === 3 && rating && (
        <>
          <Text style={styles.instruction}>
            {rating >= 4 ? "Nice! What would you like to do next?" : "Let's work on that! Choose an option:"}
          </Text>
          <View style={styles.buttonColumn}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => {
              setRating(null);
              navigation.goBack(); // Go back to note selection
            }}>
              <Text style={styles.secondaryButtonText}>Pick a Different Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => {
              setRating(null);
              gotCorrectPitchRef.current = false;
              setPitchAccuracy(null);
              setStage(0);
              setSubStep(2);
            }}>
              <Text style={styles.secondaryButtonText}>Practice Again</Text>
            </TouchableOpacity>
            {rating >= 4 && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => {
                setRating(null);
                nextStage();
              }}>
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
  
  // ========================================
  // STAGE 2: Focus Card Practice
  // ========================================
  // Compact single-panel design with tab navigation
  const FOCUS_STEPS = [
    { key: 'listen', emoji: '👂', label: 'Listen' },
    { key: 'sing', emoji: '🎤', label: 'Sing' },
    { key: 'imagine', emoji: '🧠', label: 'Imagine' },
    { key: 'play', emoji: '🎺', label: 'Play' },
  ];
  
  const renderStage2 = () => {
    const currentCard = DAY0_FOCUS_CARDS[focusCardIndex];
    const allCardsComplete = focusCardRatings.length === DAY0_FOCUS_CARDS.length;
    const allRatingsGood = allCardsComplete && focusCardRatings.every(r => r >= 4);
    const showRating = focusStepsDone.play; // Show rating after play is done
    
    // Reset steps when moving to a new card
    const resetSteps = () => {
      setFocusStepsDone({ listen: false, sing: false, imagine: false, play: false });
      setFocusActiveStep(0);
      setPitchAccuracy(null);
    };
    
    // Navigate to next step
    const nextFocusStep = () => {
      const stepKey = FOCUS_STEPS[focusActiveStep].key;
      setFocusStepsDone(prev => ({ ...prev, [stepKey]: true }));
      if (focusActiveStep < 3) {
        setFocusActiveStep(focusActiveStep + 1);
      }
    };
    
    // Navigate to previous step
    const prevFocusStep = () => {
      if (focusActiveStep > 0) {
        setFocusActiveStep(focusActiveStep - 1);
      }
    };
    
    // Render content based on active step
    const renderStepContent = () => {
      switch (focusActiveStep) {
        case 0: // Listen
          return (
            <View style={styles.stepContentArea}>
              <Text style={styles.stepInstruction}>Listen to your note with the focus in mind</Text>
              <TouchableOpacity
                style={[styles.focusActionButton, isPlaying && styles.buttonDisabled]}
                onPress={() => {
                  focusListenStartedRef.current = true;
                  playNote();
                }}
                disabled={isPlaying}
              >
                <Text style={styles.focusActionButtonText}>
                  {isPlaying ? "🔊 Playing..." : "▶️ Play Note"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        case 1: // Sing
          return (
            <View style={styles.stepContentArea}>
              <Text style={styles.stepInstruction}>Sing the note with an "Oh" sound</Text>
              <EDMVisualizer volume={volume} pitchAccuracy="listening" />
              <AudioInput
                enabled={true}
                onVolumeChange={setVolume}
                volumeThreshold={0.1}
              />
            </View>
          );
        case 2: // Imagine
          return (
            <View style={styles.stepContentArea}>
              <Text style={styles.stepInstruction}>Hear the note clearly in your mind</Text>
              <Text style={styles.focusReminderBold}>Remember the focus above!</Text>
              <CircularVolumeIndicator volume={0.3} pitchAccuracy="listening" size={100} />
            </View>
          );
        case 3: // Play
          return (
            <View style={styles.stepContentArea}>
              <Text style={styles.stepInstruction}>Play your note on your {instrument}</Text>
              <EDMVisualizer volume={volume} pitchAccuracy={pitchAccuracy} />
              <AudioInput
                enabled={true}
                targetNote={resonantNote}
                onVolumeChange={setVolume}
                onPitchMatch={handlePitchMatch}
                volumeThreshold={0.03}
                pitchMargin={50}
              />
              {pitchAccuracy === "correct" && (
                <Text style={styles.successTextSmall}>✓ Correct!</Text>
              )}
            </View>
          );
        default:
          return null;
      }
    };
    
    return (
      <View style={styles.stageContainer}>
        <Text style={styles.stageTitle}>Refine Your Sound</Text>
        
        {!allCardsComplete && (
          <Text style={styles.subtitle}>
            Focus Card {focusCardIndex + 1} of {DAY0_FOCUS_CARDS.length}
          </Text>
        )}
        
        {/* Main practice screen - compact panel */}
        {!allCardsComplete && !showRating && (
          <View style={styles.focusPracticePanel}>
            {/* Prominent Focus Banner */}
            <View style={styles.focusBanner}>
              <Text style={styles.focusBannerLabel}>🎯 FOCUS</Text>
              <Text style={styles.focusBannerTitle}>{currentCard.name}</Text>
              <Text style={styles.focusBannerCue}>"{currentCard.cue}"</Text>
            </View>
            
            {/* Note Display */}
            <View style={styles.focusNoteRow}>
              <Text style={styles.focusNoteLabel}>Playing:</Text>
              <Text style={styles.focusMiniNote}>
                {noteInfo.letter}{noteInfo.accidental}{noteInfo.octave}
              </Text>
            </View>
            
            {/* Tab Bar */}
            <View style={styles.focusTabBar}>
              {FOCUS_STEPS.map((step, idx) => (
                <TouchableOpacity
                  key={step.key}
                  style={[
                    styles.focusTab,
                    focusActiveStep === idx && styles.focusTabActive,
                    focusStepsDone[step.key] && styles.focusTabDone,
                  ]}
                  onPress={() => setFocusActiveStep(idx)}
                >
                  <Text style={styles.focusTabEmoji}>{step.emoji}</Text>
                  <Text style={[
                    styles.focusTabLabel,
                    focusActiveStep === idx && styles.focusTabLabelActive,
                  ]}>
                    {focusStepsDone[step.key] ? '✓' : step.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Shared Content Area */}
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <View style={styles.focusNavBar}>
              <TouchableOpacity
                style={[styles.focusNavButton, focusActiveStep === 0 && styles.focusNavButtonDisabled]}
                onPress={prevFocusStep}
                disabled={focusActiveStep === 0}
              >
                <Text style={styles.focusNavButtonText}>← Back</Text>
              </TouchableOpacity>
              
              {focusActiveStep < 3 ? (
                <TouchableOpacity
                  style={styles.focusNavButtonPrimary}
                  onPress={nextFocusStep}
                >
                  <Text style={styles.focusNavButtonPrimaryText}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.focusNavButtonPrimary}
                  onPress={() => setFocusStepsDone(prev => ({ ...prev, play: true }))}
                >
                  <Text style={styles.focusNavButtonPrimaryText}>Rate →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        {/* Rating screen after completing all 4 steps */}
        {!allCardsComplete && showRating && (
          <>
            <View style={styles.focusCard}>
              <Text style={styles.focusCardTitle}>Focus: {currentCard.name}</Text>
              <Text style={styles.focusCardDescription}>{currentCard.description}</Text>
              <Text style={styles.focusCardCue}>"{currentCard.cue}"</Text>
            </View>
            
            <Text style={styles.instruction}>
              How did that feel with the "{currentCard.name}" focus?
            </Text>
            <View style={styles.ratingContainer}>
              {RATING_FACES.map((face) => (
                <TouchableOpacity
                  key={face.value}
                  style={styles.ratingButton}
                  onPress={() => {
                    // Save rating for this card
                    const newRatings = [...focusCardRatings, face.value];
                    setFocusCardRatings(newRatings);
                    
                    // Move to next card or final summary
                    if (focusCardIndex < DAY0_FOCUS_CARDS.length - 1) {
                      setFocusCardIndex(prev => prev + 1);
                      resetSteps();
                    }
                    // If last card, allCardsComplete will be true on next render
                  }}
                >
                  <Text style={styles.ratingEmoji}>{face.emoji}</Text>
                  <Text style={styles.ratingLabel}>{face.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        
        {/* Final Summary after all cards */}
        {allCardsComplete && (
          <>
            <Text style={styles.successText}>🎉 Focus Practice Complete!</Text>
            <Text style={styles.instruction}>Your ratings:</Text>
            <View style={styles.ratingSummary}>
              {DAY0_FOCUS_CARDS.map((card, idx) => (
                <View key={idx} style={styles.ratingSummaryRow}>
                  <Text style={styles.ratingSummaryCard}>{card.name}:</Text>
                  <Text style={styles.ratingSummaryEmoji}>
                    {RATING_FACES.find(f => f.value === focusCardRatings[idx])?.emoji || "😐"}
                  </Text>
                </View>
              ))}
            </View>
            
            {allRatingsGood ? (
              <>
                <Text style={styles.successMessage}>
                  Excellent! You felt good about all three focus concepts!
                </Text>
                <View style={styles.buttonColumn}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => {
                    setFocusCardRatings([]);
                    setFocusCardIndex(0);
                    setFocusStepsDone({ listen: false, sing: false, imagine: false, play: false });
                  }}>
                    <Text style={styles.secondaryButtonText}>Practice Cards Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
                    <Text style={styles.primaryButtonText}>Continue →</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.instruction}>
                  Let's keep working on it! Choose an option:
                </Text>
                <View style={styles.buttonColumn}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => {
                    setFocusCardRatings([]);
                    navigation.goBack();
                  }}>
                    <Text style={styles.secondaryButtonText}>Pick a Different Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => {
                    setFocusCardRatings([]);
                    setFocusCardIndex(0);
                    setFocusStepsDone({ listen: false, sing: false, imagine: false, play: false });
                  }}>
                    <Text style={styles.primaryButtonText}>Practice Cards Again</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </View>
    );
  };
  
  // ========================================
  // STAGE 3: Learn About Staff
  // ========================================
  const renderStage3 = () => (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>The Musical Staff</Text>
      
      {subStep === 0 && (
        <>
          <View style={styles.staffVisual}>
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
          </View>
          <Text style={styles.instruction}>
            This is a <Text style={styles.bold}>staff</Text> (sometimes called a stave).
            {'\n\n'}
            It has <Text style={styles.bold}>5 lines</Text> and <Text style={styles.bold}>4 spaces</Text>.
            {'\n\n'}
            Notes sit on the lines or in the spaces to tell us which pitch to play.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setSubStep(1)}>
            <Text style={styles.primaryButtonText}>Got it →</Text>
          </TouchableOpacity>
        </>
      )}
      
      {subStep === 1 && (
        <>
          <Text style={styles.funFact}>🏥 Fun Memory Trick</Text>
          <Image
            source={require('../assets/staff_infection.jpg')}
            style={styles.staffInfectionImage}
            resizeMode="contain"
          />
          <Text style={styles.instruction}>
            🤣 5 lines = staff = "staff infection"
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
            <Text style={styles.primaryButtonText}>Ha! Next →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
  
  // ========================================
  // STAGE 4: Learn About Clef
  // ========================================
  const renderStage4 = () => (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Your Clef</Text>
      
      {subStep === 0 && (
        <>
          <Text style={styles.clefSymbol}>
            {clefType === "bass" ? "𝄢" : clefType === "treble" ? "𝄞" : "𝄡"}
          </Text>
          <Text style={styles.instruction}>
            This is the <Text style={styles.bold}>{clefType === "bass" ? "Bass" : clefType === "treble" ? "Treble" : "Alto"} Clef</Text>.
            {'\n\n'}
            A clef tells us which notes go on which lines.
            {'\n\n'}
            Your instrument ({instrument}) uses the {clefType} clef.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setSubStep(1)}>
            <Text style={styles.primaryButtonText}>Tell me more →</Text>
          </TouchableOpacity>
        </>
      )}
      
      {subStep === 1 && clefType === "bass" && (
        <>
          <View style={styles.imageWhiteBubble}>
            <Image
              source={require('../assets/bass_cleff_f.png')}
              style={styles.bassClefImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.instruction}>
            The bass clef is also called the <Text style={styles.bold}>F clef</Text>.
            {'\n\n'}
            See those two dots? The note F sits right between them!
            {'\n\n'}
            Instruments that use bass clef: {BASS_CLEF_INSTRUMENTS.join(", ")}.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
            <Text style={styles.primaryButtonText}>Got it →</Text>
          </TouchableOpacity>
        </>
      )}
      
      {subStep === 1 && clefType === "treble" && (
        <>
          <Text style={styles.clefSymbol}>𝄞</Text>
          <Text style={styles.instruction}>
            The treble clef is also called the <Text style={styles.bold}>G clef</Text>.
            {'\n\n'}
            See how it curls around the second line? That line is G!
            {'\n\n'}
            Most melody instruments use treble clef.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
            <Text style={styles.primaryButtonText}>Got it →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
  
  // ========================================
  // STAGE 5: Learn About Sharps and Flats
  // ========================================
  const renderStage5 = () => (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Sharps and Flats</Text>
      
      {subStep === 0 && (
        <>
          <View style={styles.accidentalRow}>
            <View style={styles.accidentalBox}>
              <Text style={styles.accidentalSymbol}>♯</Text>
              <Text style={styles.accidentalName}>Sharp</Text>
            </View>
            <View style={styles.accidentalBox}>
              <Text style={styles.accidentalSymbol}>♭</Text>
              <Text style={styles.accidentalName}>Flat</Text>
            </View>
          </View>
          <Text style={styles.instruction}>
            Music uses 12 different pitches.
            {'\n\n'}
            <Text style={styles.bold}>Sharp (♯)</Text> = one step higher{'\n'}
            <Text style={styles.bold}>Flat (♭)</Text> = one step lower
            {'\n\n'}
            For example:{'\n'}
            C♯ is one step above C{'\n'}
            B♭ is one step below B
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setSubStep(1)}>
            <Text style={styles.primaryButtonText}>Makes sense →</Text>
          </TouchableOpacity>
        </>
      )}
      
      {subStep === 1 && (
        <>
          <Text style={styles.instruction}>
            Your note is <Text style={styles.bold}>{noteInfo.letter}{noteInfo.accidental}</Text>
            {noteInfo.hasAccidental && (
              <>
                {'\n\n'}
                That {noteInfo.accidental === "♯" ? "sharp" : "flat"} symbol means it's one step 
                {noteInfo.accidental === "♯" ? " higher than " : " lower than "}
                {noteInfo.letter} natural.
              </>
            )}
            {!noteInfo.hasAccidental && (
              <>
                {'\n\n'}
                This is a "natural" note—no sharp or flat needed.
              </>
            )}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
            <Text style={styles.primaryButtonText}>Show me my note! →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
  
  // ========================================
  // STAGE 6: See Your Note on the Staff
  // ========================================
  const renderStage6 = () => (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Your Note on the Staff</Text>
      
      <View style={styles.notationContainer}>
        <NotationDisplay 
          musicxml={stage6MusicXML} 
          width={280} 
          height={160}
          showTitle={false}
        />
      </View>
      
      <Text style={styles.instruction}>
        This is <Text style={styles.bold}>{noteInfo.letter}{noteInfo.accidental}{noteInfo.octave}</Text> on the {clefType} clef staff.
        {'\n\n'}
        This is the note you practiced playing!
      </Text>
      
      <TouchableOpacity
        style={[styles.secondaryButton, isPlaying && styles.buttonDisabled]}
        onPress={playNote}
        disabled={isPlaying}
      >
        <Text style={styles.secondaryButtonText}>
          {isPlaying ? "🔊 Playing..." : "▶️ Play Your Note"}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.hint}>
        Remember: You first <Text style={styles.italic}>heard</Text> it, <Text style={styles.italic}>sang</Text> it, 
        <Text style={styles.italic}> imagined</Text> it, then <Text style={styles.italic}>played</Text> it.
        {'\n'}
        Sound before symbol. Always. 🎵
      </Text>
      
      <TouchableOpacity style={styles.primaryButton} onPress={completeDay0}>
        <Text style={styles.primaryButtonText}>🎉 Start Practicing!</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Helper function to position note on staff (simplified)
  function getNotePosition(note, clef) {
    // This is a simplified positioning - in a real app, we'd calculate precisely
    const notePositions = {
      bass: { "F3": 45, "E3": 55, "D3": 65, "C3": 75, "B2": 85, "Bb3": 40, "Bb2": 90 },
      treble: { "G4": 45, "F4": 55, "E4": 65, "D4": 75, "C4": 85, "B4": 35, "A4": 40 },
    };
    return (notePositions[clef]?.[note] || 55) + '%';
  }
  
  // Render current stage
  const renderStage = () => {
    switch (stage) {
      case 0: return renderStage0();
      case 1: return renderStage1();
      case 2: return renderStage2();
      case 3: return renderStage3();
      case 4: return renderStage4();
      case 5: return renderStage5();
      case 6: return renderStage6();
      default: return renderStage0();
    }
  };
  
  if (Platform.OS !== "web") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Day 0 experience is currently only available on web.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace("StartPractice")}
        >
          <Text style={styles.primaryButtonText}>Skip to Practice</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        {[0, 1, 2, 3, 4, 5, 6].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s === stage && styles.progressDotActive,
              s < stage && styles.progressDotComplete,
            ]}
          />
        ))}
      </View>
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {renderStage()}
    </ScrollView>
    <DevNavMenu
      stage={stage}
      setStage={setStage}
      setSubStep={setSubStep}
      setFocusCardIndex={setFocusCardIndex}
      setFocusStepsDone={setFocusStepsDone}
      setFocusCardRatings={setFocusCardRatings}
      setPitchAccuracy={setPitchAccuracy}
      userId={userId}
      navigation={navigation}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b2c1a",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  progressDotActive: {
    backgroundColor: "#FFD700",
    transform: [{ scale: 1.3 }],
  },
  progressDotComplete: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  stageContainer: {
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  notationContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginVertical: 16,
    alignItems: "center",
  },
  stageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  subtitle: {
    fontSize: 16,
    color: "#fffbe6",
    marginBottom: 20,
  },
  noteDisplay: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#FFD700",
    marginVertical: 20,
  },
  instruction: {
    fontSize: 18,
    color: "#fffbe6",
    textAlign: "center",
    lineHeight: 28,
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  hint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  bold: {
    fontWeight: "bold",
    color: "#FFD700",
  },
  italic: {
    fontStyle: "italic",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 10,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
    marginVertical: 10,
  },
  secondaryButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  buttonColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 20,
    flexWrap: "wrap",
  },
  ratingButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#2d2419",
    borderWidth: 1,
    borderColor: "#3b2c1a",
    minWidth: 60,
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 11,
    color: "#a09080",
    textAlign: "center",
  },
  playScreenContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  playScreenContent: {
    alignItems: "center",
    flex: 1,
  },
  feedbackContainer: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomButtonContainer: {
    alignItems: "center",
    paddingBottom: 20,
    marginTop: 20,
  },
  successText: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "bold",
    marginVertical: 15,
  },
  warningText: {
    fontSize: 16,
    color: "#FF9800",
    marginTop: 10,
  },
  errorBanner: {
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#FFF",
    fontSize: 14,
  },
  dismissText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  focusCard: {
    backgroundColor: "#2a1f15",
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
    width: "100%",
    maxWidth: 400,
  },
  focusCardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  focusCardDescription: {
    fontSize: 16,
    color: "#fffbe6",
    marginBottom: 15,
    textAlign: "center",
  },
  focusCardCue: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  focusCardMini: {
    backgroundColor: "#2a1f15",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  focusCardMiniTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD700",
    textAlign: "center",
  },
  ratingSummary: {
    marginVertical: 15,
    width: "100%",
    maxWidth: 300,
  },
  ratingSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  ratingSummaryCard: {
    fontSize: 16,
    color: "#fffbe6",
  },
  ratingSummaryEmoji: {
    fontSize: 24,
  },
  successMessage: {
    fontSize: 16,
    color: "#4CAF50",
    textAlign: "center",
    marginVertical: 15,
  },
  noteDisplaySmall: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 15,
    textAlign: "center",
  },
  stepsContainer: {
    width: "100%",
    maxWidth: 400,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#2a1f15",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  stepDisabled: {
    opacity: 0.5,
  },
  stepIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a140d",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFD700",
    marginBottom: 6,
  },
  stepButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  stepButtonText: {
    color: "#1a140d",
    fontWeight: "600",
    fontSize: 14,
  },
  stepDone: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 14,
  },
  stepLocked: {
    color: "#666",
    fontStyle: "italic",
    fontSize: 13,
  },
  stepHint: {
    color: "#a09080",
    fontSize: 13,
    marginBottom: 6,
  },
  successTextSmall: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 4,
  },
  // Compact Focus Practice Panel Styles
  focusPracticePanel: {
    backgroundColor: "#2a1f15",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  focusBanner: {
    backgroundColor: "#3b2c1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FF6B35",
    alignItems: "center",
  },
  focusBannerLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FF6B35",
    letterSpacing: 2,
    marginBottom: 4,
  },
  focusBannerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 6,
  },
  focusBannerCue: {
    fontSize: 13,
    color: "#fffbe6",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },
  focusNoteRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  focusNoteLabel: {
    fontSize: 14,
    color: "#a09080",
  },
  focusMiniNote: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
  },
  focusTabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 6,
  },
  focusTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#1a140d",
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  focusTabActive: {
    backgroundColor: "#3b2c1a",
    borderColor: "#FFD700",
  },
  focusTabDone: {
    backgroundColor: "#1a2a1a",
    borderColor: "#4CAF50",
  },
  focusTabEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  focusTabLabel: {
    fontSize: 10,
    color: "#a09080",
    textAlign: "center",
  },
  focusTabLabelActive: {
    color: "#FFD700",
    fontWeight: "600",
  },
  stepContentArea: {
    alignItems: "center",
    minHeight: 180,
    justifyContent: "center",
    paddingVertical: 10,
  },
  stepInstruction: {
    fontSize: 14,
    color: "#fffbe6",
    textAlign: "center",
    marginBottom: 12,
  },
  focusReminder: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  focusReminderBold: {
    fontSize: 13,
    color: "#FF6B35",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  focusActionButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  focusActionButtonText: {
    color: "#1a140d",
    fontWeight: "600",
    fontSize: 16,
  },
  focusNavBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
  },
  focusNavButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a09080",
  },
  focusNavButtonDisabled: {
    opacity: 0.3,
  },
  focusNavButtonText: {
    color: "#a09080",
    fontSize: 14,
  },
  focusNavButtonPrimary: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  focusNavButtonPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  staffVisual: {
    marginVertical: 30,
    alignItems: "center",
    width: 280,
    paddingVertical: 10,
  },
  staffLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#FFD700",
    marginVertical: 8,
  },
  funFact: {
    fontSize: 20,
    color: "#4CAF50",
    fontWeight: "bold",
    marginBottom: 15,
  },
  staffInfectionImage: {
    width: 300,
    height: 250,
    marginVertical: 15,
    borderRadius: 10,
  },
  bassClefImage: {
    width: 240,
    height: 160,
  },
  imageWhiteBubble: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  clefSymbol: {
    fontSize: 100,
    color: "#FFD700",
    marginVertical: 20,
  },
  accidentalRow: {
    flexDirection: "row",
    gap: 40,
    marginVertical: 20,
  },
  accidentalBox: {
    alignItems: "center",
  },
  accidentalSymbol: {
    fontSize: 60,
    color: "#FFD700",
  },
  accidentalName: {
    fontSize: 16,
    color: "#fffbe6",
    marginTop: 5,
  },
  staffWithNote: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  staffClef: {
    fontSize: 60,
    color: "#FFD700",
    marginRight: 10,
  },
  staffLinesContainer: {
    position: "relative",
    flex: 1,
  },
  staffLineNote: {
    color: "#FFD700",
    fontSize: 14,
    marginVertical: 6,
    letterSpacing: 1,
  },
  noteHead: {
    position: "absolute",
    left: "50%",
    flexDirection: "row",
    alignItems: "center",
    transform: [{ translateX: -15 }],
  },
  noteHeadText: {
    fontSize: 36,
    color: "#4CAF50",
  },
  noteAccidental: {
    fontSize: 24,
    color: "#4CAF50",
    marginLeft: -10,
    marginTop: -15,
  },
});

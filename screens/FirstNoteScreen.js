import React, { useState, useEffect, useRef, useCallback } from "react";
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
import ResetButton from "../components/ResetButton";

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
    octave: parseInt(match[3], 10),
    hasAccidental: match[2] !== "",
  };
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
  // Single screen: Focus card on top, 4 progressive steps below with icons
  // Unlocking: Listen -> Sing -> Imagine -> Play -> Rate
  const renderStage2 = () => {
    const currentCard = DAY0_FOCUS_CARDS[focusCardIndex];
    const allCardsComplete = focusCardRatings.length === DAY0_FOCUS_CARDS.length;
    const allRatingsGood = allCardsComplete && focusCardRatings.every(r => r >= 4);
    const showRating = focusStepsDone.play; // Show rating after play is done
    
    // Reset steps when moving to a new card
    const resetSteps = () => {
      setFocusStepsDone({ listen: false, sing: false, imagine: false, play: false });
      setPitchAccuracy(null);
    };
    
    return (
      <View style={styles.stageContainer}>
        <Text style={styles.stageTitle}>Refine Your Sound</Text>
        
        {!allCardsComplete && (
          <Text style={styles.subtitle}>
            Focus Card {focusCardIndex + 1} of {DAY0_FOCUS_CARDS.length}
          </Text>
        )}
        
        {/* Main practice screen - show focus card + steps */}
        {!allCardsComplete && !showRating && (
          <>
            {/* Full Focus Card */}
            <View style={styles.focusCard}>
              <Text style={styles.focusCardTitle}>Focus: {currentCard.name}</Text>
              <Text style={styles.focusCardDescription}>{currentCard.description}</Text>
              <Text style={styles.focusCardCue}>"{currentCard.cue}"</Text>
            </View>
            
            {/* Note display */}
            <Text style={styles.noteDisplaySmall}>
              {noteInfo.letter}{noteInfo.accidental}{noteInfo.octave}
            </Text>
            
            {/* Four-step flow */}
            <View style={styles.stepsContainer}>
              {/* Listen Step */}
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Text style={styles.stepEmoji}>👂</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepLabel}>Listen</Text>
                  {!focusStepsDone.listen ? (
                    <TouchableOpacity
                      style={[styles.stepButton, isPlaying && styles.buttonDisabled]}
                      onPress={() => {
                        focusListenStartedRef.current = true;
                        playNote();
                      }}
                      disabled={isPlaying}
                    >
                      <Text style={styles.stepButtonText}>
                        {isPlaying ? "🔊 Playing..." : "▶️ Play"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.stepDone}>✓ Done</Text>
                  )}
                </View>
              </View>
              
              {/* Sing Step */}
              <View style={[styles.stepRow, !focusStepsDone.listen && styles.stepDisabled]}>
                <View style={styles.stepIcon}>
                  <Text style={styles.stepEmoji}>🎤</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepLabel}>Sing</Text>
                  {focusStepsDone.listen && !focusStepsDone.sing ? (
                    <>
                      <EDMVisualizer volume={volume} pitchAccuracy="listening" />
                      <AudioInput
                        enabled={true}
                        onVolumeChange={setVolume}
                        volumeThreshold={0.1}
                      />
                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => {
                          setFocusStepsDone(prev => ({ ...prev, sing: true }));
                        }}
                      >
                        <Text style={styles.stepButtonText}>Done Singing</Text>
                      </TouchableOpacity>
                    </>
                  ) : focusStepsDone.sing ? (
                    <Text style={styles.stepDone}>✓ Done</Text>
                  ) : (
                    <Text style={styles.stepLocked}>Unlock by listening first</Text>
                  )}
                </View>
              </View>
              
              {/* Imagine Step */}
              <View style={[styles.stepRow, !focusStepsDone.sing && styles.stepDisabled]}>
                <View style={styles.stepIcon}>
                  <Text style={styles.stepEmoji}>🧠</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepLabel}>Imagine</Text>
                  {focusStepsDone.sing && !focusStepsDone.imagine ? (
                    <>
                      <Text style={styles.stepHint}>Hear the note in your mind with the focus...</Text>
                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => {
                          setFocusStepsDone(prev => ({ ...prev, imagine: true }));
                        }}
                      >
                        <Text style={styles.stepButtonText}>I'm Imagining It</Text>
                      </TouchableOpacity>
                    </>
                  ) : focusStepsDone.imagine ? (
                    <Text style={styles.stepDone}>✓ Done</Text>
                  ) : (
                    <Text style={styles.stepLocked}>Unlock by singing first</Text>
                  )}
                </View>
              </View>
              
              {/* Play Step */}
              <View style={[styles.stepRow, !focusStepsDone.imagine && styles.stepDisabled]}>
                <View style={styles.stepIcon}>
                  <Text style={styles.stepEmoji}>🎺</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepLabel}>Play</Text>
                  {focusStepsDone.imagine && !focusStepsDone.play ? (
                    <>
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
                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => {
                          setFocusStepsDone(prev => ({ ...prev, play: true }));
                        }}
                      >
                        <Text style={styles.stepButtonText}>Done Playing</Text>
                      </TouchableOpacity>
                    </>
                  ) : focusStepsDone.play ? (
                    <Text style={styles.stepDone}>✓ Done</Text>
                  ) : (
                    <Text style={styles.stepLocked}>Unlock by imagining first</Text>
                  )}
                </View>
              </View>
            </View>
          </>
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
            <Text style={styles.staffLines}>━━━━━━━━━━━━━━━━━━━━━</Text>
            <Text style={styles.staffLines}>━━━━━━━━━━━━━━━━━━━━━</Text>
            <Text style={styles.staffLines}>━━━━━━━━━━━━━━━━━━━━━</Text>
            <Text style={styles.staffLines}>━━━━━━━━━━━━━━━━━━━━━</Text>
            <Text style={styles.staffLines}>━━━━━━━━━━━━━━━━━━━━━</Text>
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
          <Text style={styles.clefSymbol}>𝄢</Text>
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
      
      <View style={styles.staffWithNote}>
        <Text style={styles.staffClef}>
          {clefType === "bass" ? "𝄢" : "𝄞"}
        </Text>
        <View style={styles.staffLinesContainer}>
          <Text style={styles.staffLineNote}>━━━━━━━━━━━━━━━━━━</Text>
          <Text style={styles.staffLineNote}>━━━━━━━━━━━━━━━━━━</Text>
          <Text style={styles.staffLineNote}>━━━━━━━━━━━━━━━━━━</Text>
          <Text style={styles.staffLineNote}>━━━━━━━━━━━━━━━━━━</Text>
          <Text style={styles.staffLineNote}>━━━━━━━━━━━━━━━━━━</Text>
          {/* Note head - simplified visual */}
          <View style={[styles.noteHead, { top: getNotePosition(resonantNote, clefType) }]}>
            <Text style={styles.noteHeadText}>●</Text>
            {noteInfo.hasAccidental && (
              <Text style={styles.noteAccidental}>{noteInfo.accidental}</Text>
            )}
          </View>
        </View>
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
    <ResetButton userId={userId} />
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
  staffVisual: {
    marginVertical: 20,
    alignItems: "center",
  },
  staffLines: {
    color: "#FFD700",
    fontSize: 16,
    marginVertical: 4,
    letterSpacing: 2,
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

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { getBackendUrl } from "../src/api/client";

/**
 * AudioPlayer Component for LISTEN steps
 *
 * Plays audio model phrases for ear-first learning.
 * Fetches audio from backend which generates from MusicXML.
 * Uses HTML5 Audio on web, shows placeholder on native until expo-av is added.
 *
 * Props:
 * - materialId: ID of the material (required)
 * - targetKey: Target key for transposition (e.g., "Bb major")
 * - instrument: User's instrument for soundfont (default: "piano")
 * - title: Display title for the audio
 * - onComplete: Callback when audio finishes playing
 * - autoPlay: Auto-start playback when component mounts
 * - showProgress: Show progress bar
 * - accentColor: Theme accent color
 */

export default function AudioPlayer({
  materialId,
  targetKey,
  instrument = "piano",
  title = "Listen to the model",
  onComplete,
  autoPlay = false,
  showProgress = true,
  accentColor = "#4A90D9",
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [audioStatus, setAudioStatus] = useState(null);

  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Build audio URL from material ID and key
  const audioUrl =
    materialId && targetKey
      ? `${getBackendUrl()}/audio/material/${materialId}?key=${encodeURIComponent(targetKey)}&instrument=${encodeURIComponent(instrument)}`
      : null;

  // Check audio generation status on mount
  useEffect(() => {
    fetch(`${getBackendUrl()}/audio/status`)
      .then((res) => res.json())
      .then((data) => setAudioStatus(data))
      .catch(() =>
        setAudioStatus({ can_render_audio: false, can_render_midi: false }),
      );
  }, []);

  // Initialize audio on web
  useEffect(() => {
    if (Platform.OS === "web" && audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
        setIsLoaded(true);
        setError(null);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (onComplete) onComplete();
      });

      audio.addEventListener("error", (e) => {
        setError("Audio failed to load");
        setIsLoaded(false);
      });

      if (autoPlay) {
        audio.play().catch(() => {
          // Autoplay blocked by browser
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }

      return () => {
        audio.pause();
        audio.src = "";
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [audioUrl]);

  // Update progress while playing
  useEffect(() => {
    if (Platform.OS === "web" && isPlaying && audioRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100);
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlayback = () => {
    if (Platform.OS !== "web") {
      // Native: just show placeholder
      return;
    }

    if (!audioRef.current || !isLoaded) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        setError("Playback failed");
      });
      setIsPlaying(true);
    }
  };

  const seekTo = (percent) => {
    if (Platform.OS !== "web" || !audioRef.current || !isLoaded) return;
    const newTime = (percent / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Render placeholder when no material ID or key
  if (!materialId || !targetKey) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🎵</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.placeholderBox, { borderColor: accentColor }]}>
          <Text style={styles.placeholderIcon}>🎧</Text>
          <Text style={styles.placeholderText}>Audio coming soon</Text>
          <Text style={styles.placeholderSubtext}>
            Close your eyes and imagine the phrase
          </Text>
        </View>
        <Text style={styles.hint}>💡 Hear it in your mind's ear first</Text>
      </View>
    );
  }

  // Render native placeholder (expo-av not installed)
  if (Platform.OS !== "web") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🎵</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.placeholderBox, { borderColor: accentColor }]}>
          <Text style={styles.placeholderIcon}>📱</Text>
          <Text style={styles.placeholderText}>Native audio coming soon</Text>
          <Text style={styles.placeholderSubtext}>
            Install expo-av for mobile playback
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>🎵</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {error ? (
        <View style={[styles.errorBox, { borderColor: "#E74C3C" }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          {/* Playback controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: accentColor }]}
              onPress={togglePlayback}
              disabled={!isLoaded}
            >
              <Text style={styles.playButtonText}>{isPlaying ? "⏸" : "▶"}</Text>
            </TouchableOpacity>

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          {showProgress && (
            <TouchableOpacity
              style={styles.progressContainer}
              onPress={(e) => {
                const { nativeEvent } = e;
                const percent =
                  (nativeEvent.offsetX / e.target.clientWidth) * 100;
                seekTo(percent);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Loading indicator */}
          {!isLoaded && !error && (
            <Text style={styles.loadingText}>Loading audio...</Text>
          )}
        </>
      )}

      <Text style={styles.hint}>
        💡 Listen deeply — let the sound enter before you respond
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonText: {
    fontSize: 24,
    color: "#FFF",
  },
  timeContainer: {
    marginLeft: 16,
  },
  timeText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  progressContainer: {
    marginBottom: 12,
    cursor: "pointer",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  placeholderBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#FFF",
    marginBottom: 12,
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FDEDEC",
    marginBottom: 12,
  },
  errorText: {
    color: "#E74C3C",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: "#95A5A6",
    fontStyle: "italic",
    textAlign: "center",
  },
});

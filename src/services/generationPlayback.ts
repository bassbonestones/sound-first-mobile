/**
 * Generation Playback Service
 *
 * Plays PitchEvent arrays from the generation API using Web Audio.
 * Provides a simple interface for playing, pausing, and stopping generated content.
 */

import { Platform } from "react-native";
import { devWarn, devError } from "../utils/devLogger";
import type { PitchEvent } from "../api/generation";

// =============================================================================
// Types
// =============================================================================

export type PlaybackState = "stopped" | "playing" | "paused";

export interface PlaybackOptions {
  /** Tempo in BPM (default: 120) */
  tempo?: number;
  /** Master volume 0-1 (default: 0.3) */
  volume?: number;
  /** Called when playback state changes */
  onStateChange?: (state: PlaybackState) => void;
  /** Called with current event index during playback */
  onProgress?: (index: number) => void;
  /** Called when playback completes naturally */
  onComplete?: () => void;
}

// =============================================================================
// MIDI to Frequency Conversion
// =============================================================================

/**
 * Convert MIDI note number to frequency in Hz.
 * A4 (MIDI 69) = 440 Hz
 */
function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// =============================================================================
// Playback Service Class
// =============================================================================

class GenerationPlaybackService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  private events: PitchEvent[] = [];
  private currentIndex = 0;
  private playbackState: PlaybackState = "stopped";
  private tempo = 120;
  private volume = 0.3;

  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private startTime = 0;
  private pausedAt = 0;

  private onStateChange?: (state: PlaybackState) => void;
  private onProgress?: (index: number) => void;
  private onComplete?: () => void;

  /**
   * Initialize the audio context. Must be called after a user gesture on web.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Only works on web for now
    if (Platform.OS !== "web") {
      devWarn("GenerationPlayback: Native audio not implemented yet");
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) {
        devWarn("GenerationPlayback: Web Audio API not available");
        return;
      }

      this.audioContext = new AudioContextClass();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);

      this.isInitialized = true;
    } catch (error) {
      devError("GenerationPlayback: Failed to initialize", error);
    }
  }

  /**
   * Resume audio context if suspended.
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Load events for playback.
   */
  load(events: PitchEvent[], options: PlaybackOptions = {}): void {
    this.stop();
    this.events = events;
    this.currentIndex = 0;
    this.tempo = options.tempo ?? 120;
    this.volume = options.volume ?? 0.3;
    this.onStateChange = options.onStateChange;
    this.onProgress = options.onProgress;
    this.onComplete = options.onComplete;

    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Start or resume playback.
   */
  async play(): Promise<void> {
    if (!this.isInitialized || this.events.length === 0) {
      await this.init();
      if (!this.isInitialized) return;
    }

    await this.resume();

    if (this.playbackState === "paused") {
      // Resume from paused position
      this.scheduleEvents(this.currentIndex);
    } else {
      // Start from beginning
      this.currentIndex = 0;
      this.scheduleEvents(0);
    }

    this.playbackState = "playing";
    this.startTime = Date.now();
    this.onStateChange?.("playing");
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (this.playbackState !== "playing") return;

    this.clearScheduledEvents();
    this.playbackState = "paused";
    this.pausedAt = Date.now();
    this.onStateChange?.("paused");
  }

  /**
   * Stop playback and reset to beginning.
   */
  stop(): void {
    this.clearScheduledEvents();
    this.currentIndex = 0;
    this.playbackState = "stopped";
    this.startTime = 0;
    this.pausedAt = 0;
    this.onStateChange?.("stopped");
  }

  /**
   * Get current playback state.
   */
  getState(): PlaybackState {
    return this.playbackState;
  }

  /**
   * Set tempo.
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(20, Math.min(400, bpm));
  }

  /**
   * Set volume (0-1).
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Check if service is ready.
   */
  isReady(): boolean {
    return this.isInitialized && this.audioContext?.state === "running";
  }

  /**
   * Dispose of audio resources.
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.isInitialized = false;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private clearScheduledEvents(): void {
    for (const id of this.timeoutIds) {
      clearTimeout(id);
    }
    this.timeoutIds = [];
  }

  private scheduleEvents(startIndex: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const secondsPerBeat = 60 / this.tempo;
    let cumulativeOffset = 0;

    // Calculate offset for events before startIndex
    for (let i = 0; i < startIndex; i++) {
      cumulativeOffset += this.events[i].duration_beats * secondsPerBeat;
    }

    // Schedule remaining events
    for (let i = startIndex; i < this.events.length; i++) {
      const event = this.events[i];
      const delayMs =
        (event.offset_beats * secondsPerBeat - cumulativeOffset) * 1000;
      const durationMs = event.duration_beats * secondsPerBeat * 1000;

      const timeoutId = setTimeout(
        () => {
          this.currentIndex = i;
          this.onProgress?.(i);

          // Only play sound for actual notes (not rests)
          if (event.midi_note != null && event.velocity > 0) {
            this.playNote(event.midi_note, durationMs, event.velocity);
          }

          // Check if this is the last event
          if (i === this.events.length - 1) {
            // Schedule completion after note finishes
            const completeId = setTimeout(() => {
              this.playbackState = "stopped";
              this.currentIndex = 0;
              this.onStateChange?.("stopped");
              this.onComplete?.();
            }, durationMs);
            this.timeoutIds.push(completeId);
          }
        },
        Math.max(0, delayMs),
      );

      this.timeoutIds.push(timeoutId);
    }
  }

  private playNote(midi: number, durationMs: number, velocity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const frequency = midiToFrequency(midi);
    const now = this.audioContext.currentTime;
    const durationSec = durationMs / 1000;

    // Normalize velocity to 0-1 range
    const velocityGain = velocity / 127;

    // Create oscillator (triangle for softer sound)
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;

    // Second oscillator for warmth
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = "sine";
    oscillator2.detune.value = 3;
    oscillator2.frequency.value = frequency;

    // Create envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;

    // ADSR envelope
    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = 0.7 * velocityGain;
    const releaseTime = Math.min(0.15, durationSec * 0.3);

    // Attack
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(velocityGain, now + attackTime);

    // Decay
    envelope.gain.linearRampToValueAtTime(
      sustainLevel,
      now + attackTime + decayTime,
    );

    // Sustain
    const sustainEnd = now + durationSec - releaseTime;
    if (sustainEnd > now + attackTime + decayTime) {
      envelope.gain.setValueAtTime(sustainLevel, sustainEnd);
    }

    // Release
    envelope.gain.linearRampToValueAtTime(0, now + durationSec);

    // Connect
    oscillator.connect(envelope);
    oscillator2.connect(envelope);
    envelope.connect(this.masterGain);

    // Start and stop
    oscillator.start(now);
    oscillator2.start(now);
    oscillator.stop(now + durationSec + 0.01);
    oscillator2.stop(now + durationSec + 0.01);

    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect();
      oscillator2.disconnect();
      envelope.disconnect();
    };
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

/**
 * Singleton instance of GenerationPlaybackService
 * Handles audio playback for generated scales, arpeggios, and patterns
 *
 * @example
 * import { generationPlayback } from '../services/generationPlayback';
 *
 * // Play a generated scale
 * await generationPlayback.playGeneration(notes, { tempo: 120, instrument: 'piano' });
 *
 * // Stop playback
 * generationPlayback.stop();
 */
export const generationPlayback = new GenerationPlaybackService();

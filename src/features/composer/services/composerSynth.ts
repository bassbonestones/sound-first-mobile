/**
 * ComposerSynth Service
 *
 * Simple Web Audio API synthesizer for playing notes in the Practice Composer.
 * Uses basic oscillator with ADSR envelope for a pleasant sound.
 */

import { Platform } from "react-native";

// =============================================================================
// Types
// =============================================================================

export interface SynthNote {
  midi: number | null; // null = rest
  durationMs: number;
}

// =============================================================================
// MIDI to Frequency Conversion
// =============================================================================

/**
 * Convert MIDI note number to frequency in Hz.
 * A4 (MIDI 69) = 440 Hz
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// =============================================================================
// Synthesizer Class
// =============================================================================

interface ActiveSound {
  oscillator1: OscillatorNode;
  oscillator2: OscillatorNode;
  envelope: GainNode;
}

class ComposerSynthesizer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private activeSounds: ActiveSound[] = [];

  /**
   * Initialize the audio context. Must be called after a user gesture on web.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Only works on web for now
    if (Platform.OS !== "web") {
      console.warn("ComposerSynth: Native audio not implemented yet");
      return;
    }

    try {
      // Create audio context
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("ComposerSynth: Web Audio API not available");
        return;
      }

      this.audioContext = new AudioContextClass();

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // Reasonable default volume
      this.masterGain.connect(this.audioContext.destination);

      this.isInitialized = true;
    } catch (error) {
      console.error("ComposerSynth: Failed to initialize", error);
    }
  }

  /**
   * Resume audio context if suspended (required after user gesture on some browsers).
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a single note with the specified MIDI pitch and duration.
   */
  playNote(midi: number | null, durationMs: number): void {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) {
      return;
    }

    // Rest - don't play anything
    if (midi === null) {
      return;
    }

    const frequency = midiToFrequency(midi);
    const now = this.audioContext.currentTime;
    const durationSec = durationMs / 1000;

    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = "triangle"; // Softer than square, more musical than sine

    // Add slight detuning for warmth
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = "sine";
    oscillator2.detune.value = 3; // Slight detuning in cents

    oscillator.frequency.value = frequency;
    oscillator2.frequency.value = frequency;

    // Create envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;

    // ADSR envelope
    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = 0.7;
    const releaseTime = Math.min(0.15, durationSec * 0.3);

    // Attack
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + attackTime);

    // Decay
    envelope.gain.linearRampToValueAtTime(
      sustainLevel,
      now + attackTime + decayTime,
    );

    // Sustain (hold at sustain level)
    const sustainEnd = now + durationSec - releaseTime;
    if (sustainEnd > now + attackTime + decayTime) {
      envelope.gain.setValueAtTime(sustainLevel, sustainEnd);
    }

    // Release
    envelope.gain.linearRampToValueAtTime(0, now + durationSec);

    // Connect oscillators -> envelope -> master gain
    oscillator.connect(envelope);
    oscillator2.connect(envelope);
    envelope.gain.value = 0.5; // Mix level for second oscillator
    envelope.connect(this.masterGain);

    // Track this sound
    const activeSound: ActiveSound = {
      oscillator1: oscillator,
      oscillator2: oscillator2,
      envelope,
    };
    this.activeSounds.push(activeSound);

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
      // Remove from active sounds
      const index = this.activeSounds.indexOf(activeSound);
      if (index > -1) {
        this.activeSounds.splice(index, 1);
      }
    };
  }

  /**
   * Immediately stop all currently playing sounds.
   */
  stopAll(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    for (const sound of this.activeSounds) {
      try {
        // Quickly fade out to avoid clicks
        sound.envelope.gain.cancelScheduledValues(now);
        sound.envelope.gain.setValueAtTime(sound.envelope.gain.value, now);
        sound.envelope.gain.linearRampToValueAtTime(0, now + 0.02);

        // Stop oscillators shortly after fade
        sound.oscillator1.stop(now + 0.03);
        sound.oscillator2.stop(now + 0.03);
      } catch {
        // Already stopped, ignore
      }
    }

    this.activeSounds = [];
  }

  /**
   * Set master volume (0-1).
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Check if synthesizer is ready.
   */
  isReady(): boolean {
    return this.isInitialized && this.audioContext?.state === "running";
  }

  /**
   * Dispose of audio resources.
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.isInitialized = false;
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const composerSynth = new ComposerSynthesizer();

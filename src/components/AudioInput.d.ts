/**
 * Detected pitch information
 */
export interface PitchInfo {
  /** Detected frequency in Hz */
  frequency: number;
  /** Note name (e.g., "Bb3") */
  noteName: string;
  /** Cents deviation from pure pitch */
  cents: number;
}

/**
 * Props for AudioInput component
 */
export interface AudioInputProps {
  /** Callback with volume level (0-1) */
  onVolumeChange?: (volume: number) => void;
  /** Callback with detected pitch info when sound ends */
  onPitchDetected?: (pitch: PitchInfo) => void;
  /** Callback that fires during active sound with current pitch */
  onRealtimePitch?: (pitch: PitchInfo) => void;
  /** Callback when sound starts (above threshold) */
  onSoundStart?: () => void;
  /** Callback when sound ends (below threshold for duration) */
  onSoundEnd?: () => void;
  /** Target note name for pitch comparison (e.g., "Bb3") */
  targetNote?: string;
  /** Callback when playing correct pitch (within margin) */
  onPitchMatch?: () => void;
  /** Minimum volume to consider "sound" (default 0.02) */
  volumeThreshold?: number;
  /** Ms of silence before onSoundEnd fires (default 1500) */
  silenceDuration?: number;
  /** Cents margin for "correct" pitch (default 100) */
  pitchMargin?: number;
  /** Allow octave equivalence for voice/singing */
  allowOctaveEquivalent?: boolean;
  /** Whether to actively listen (default true) */
  enabled?: boolean;
  /** Show debug info (default false) */
  showDebug?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * AudioInput Component for capturing and analyzing microphone input
 *
 * Used in Day 0 first-note experience for:
 * - Detecting when user is singing/playing (volume threshold)
 * - Detecting pitch to verify they're playing the correct note
 */
declare function AudioInput(props: AudioInputProps): React.ReactElement;

export default AudioInput;

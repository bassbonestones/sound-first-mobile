/**
 * Props for AudioPlayer component
 */
export interface AudioPlayerProps {
  /** Material ID to fetch audio for (required) */
  materialId: string;
  /** Target key for transposition (e.g., "Bb major") */
  targetKey?: string;
  /** Instrument for soundfont selection */
  instrument?: string;
  /** Display title for the audio */
  title?: string;
  /** Callback when audio finishes playing */
  onComplete?: () => void;
  /** Auto-start playback when component mounts */
  autoPlay?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
  /** Theme accent color */
  accentColor?: string;
}

/**
 * AudioPlayer Component for LISTEN steps
 *
 * Plays audio model phrases for ear-first learning.
 * Fetches audio from backend which generates from MusicXML.
 * Uses HTML5 Audio on web, shows placeholder on native until expo-av is added.
 */
declare function AudioPlayer(props: AudioPlayerProps): React.ReactElement;

export default AudioPlayer;

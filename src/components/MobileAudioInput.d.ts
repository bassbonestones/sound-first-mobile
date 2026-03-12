import { PitchInfo, AudioInputProps } from "./AudioInput";

/**
 * Props for MobileAudioInput component
 * Same interface as AudioInput but optimized for mobile platforms
 */
export interface MobileAudioInputProps extends AudioInputProps {}

/**
 * MobileAudioInput - Audio input component for native mobile platforms
 *
 * Uses react-native-audio-api for pitch detection on iOS/Android.
 * Same interface as AudioInput but with native implementation.
 */
declare function MobileAudioInput(
  props: MobileAudioInputProps,
): React.ReactElement;

export default MobileAudioInput;

// Re-export PitchInfo for convenience
export type { PitchInfo };

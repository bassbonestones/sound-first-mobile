import { ViewStyle } from "react-native";

/**
 * Pitch accuracy state for visualizer
 */
export type PitchAccuracy = "correct" | "off" | "listening" | null;

/**
 * Props for EDMVisualizer component
 */
export interface EDMVisualizerProps {
  /** Volume level (0-1) */
  volume?: number;
  /** Current pitch accuracy state */
  pitchAccuracy?: PitchAccuracy;
  /** Number of bars to display */
  barCount?: number;
  /** Additional container styles */
  style?: ViewStyle | ViewStyle[];
}

/**
 * Props for EDMVisualizerMedium component
 */
export interface EDMVisualizerMediumProps {
  /** Volume level (0-1) */
  volume?: number;
  /** Current pitch accuracy state */
  pitchAccuracy?: PitchAccuracy;
  /** Number of bars to display */
  barCount?: number;
  /** Additional container styles */
  style?: ViewStyle | ViewStyle[];
}

/**
 * Props for EDMVisualizerCompact component
 */
export interface EDMVisualizerCompactProps {
  /** Volume level (0-1) */
  volume?: number;
  /** Current pitch accuracy state */
  pitchAccuracy?: PitchAccuracy;
  /** Number of bars to display */
  barCount?: number;
  /** Width of the visualizer */
  width?: number;
  /** Height of the visualizer */
  height?: number;
}

/**
 * EDM-style audio visualizer with animated bars
 */
declare function EDMVisualizer(props: EDMVisualizerProps): React.ReactElement;

/**
 * Medium-sized EDM visualizer
 */
export declare const EDMVisualizerMedium: React.FC<EDMVisualizerMediumProps>;

/**
 * Compact EDM visualizer
 */
export declare const EDMVisualizerCompact: React.FC<EDMVisualizerCompactProps>;

export default EDMVisualizer;

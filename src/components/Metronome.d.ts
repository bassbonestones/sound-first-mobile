/**
 * Metronome component type declarations
 */
import React from "react";

export interface MetronomeProps {
  initialBpm?: number;
  beatsPerMeasure?: number;
  initialNoteValue?: number;
  initialSubdivision?: "none" | "halves" | "triplet" | "quarters";
  autoStart?: boolean;
  showControls?: boolean;
  showTimeSignature?: boolean;
  showSubdivision?: boolean;
  muted?: boolean;
  volume?: number;
  hideInternalMute?: boolean;
}

declare const Metronome: React.FC<MetronomeProps>;
export default Metronome;

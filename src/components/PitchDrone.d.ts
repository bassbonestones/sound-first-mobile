/**
 * PitchDrone component type declarations
 */
import React from "react";

export interface PitchDroneProps {
  initialNote?: string;
  autoStart?: boolean;
  muted?: boolean;
  volume?: number;
  hideInternalMute?: boolean;
}

declare const PitchDrone: React.FC<PitchDroneProps>;
export default PitchDrone;

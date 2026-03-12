/**
 * Type declarations for audioUtils
 */

export interface NoteInfo {
  noteName: string;
  midiNote: number;
  frequency: number;
  cents: number;
}

export interface AutoCorrelateResult {
  frequency: number;
  confidence: number;
  rms: number;
}

export function frequencyToNote(frequency: number): NoteInfo | null;
export function noteNameToMidi(noteName: string): number | null;
export function autoCorrelate(
  buffer: Float32Array,
  sampleRate: number,
): AutoCorrelateResult;
export function base64ToFloat32Array(base64: string): Float32Array;

/**
 * Notes constants type declarations
 */

export function frequencyToNote(frequency: number): string;
export function getCentsDeviation(frequency: number): number;
export function noteToFrequency(note: string, octave?: number): number;

export const NOTE_FREQUENCIES: Record<string, number>;
export const ALL_NOTES: string[];

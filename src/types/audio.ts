/**
 * Audio-related type definitions
 *
 * Shared types for audio components including pitch detection,
 * volume visualization, and audio input handling.
 */

/**
 * Pitch accuracy state for visualizers and feedback components.
 * - "correct": User's pitch matches target
 * - "off": User's pitch does not match target
 * - "listening": Actively detecting pitch, no determination yet
 * - null: Not active/no pitch being played
 */
export type PitchAccuracy = "correct" | "off" | "listening" | null;

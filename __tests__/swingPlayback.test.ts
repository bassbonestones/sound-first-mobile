/**
 * Swing Playback Tests
 *
 * Tests for swing timing functionality in the tune composer.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useTuneComposerState } from "../src/features/tune-composer/hooks/useTuneComposerState";
import {
  getSwungDuration,
  SWING_RATIO,
} from "../src/features/tune-composer/hooks/useTuneComposerPlayback";

describe("Swing Playback", () => {
  describe("swingEnabled state", () => {
    it("should initialize with swing disabled", () => {
      const { result } = renderHook(() => useTuneComposerState());

      expect(result.current.swingEnabled).toBe(false);
    });

    it("should enable swing via setSwingEnabled", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.setSwingEnabled(true);
      });

      expect(result.current.swingEnabled).toBe(true);
    });

    it("should disable swing via setSwingEnabled", () => {
      const { result } = renderHook(() => useTuneComposerState());

      // Enable first
      act(() => {
        result.current.setSwingEnabled(true);
      });
      expect(result.current.swingEnabled).toBe(true);

      // Then disable
      act(() => {
        result.current.setSwingEnabled(false);
      });

      expect(result.current.swingEnabled).toBe(false);
    });

    it("should persist swingEnabled in score playbackSettings", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.setSwingEnabled(true);
      });

      expect(result.current.score.playbackSettings.swingEnabled).toBe(true);
    });
  });

  describe("getSwungDuration", () => {
    const EIGHTH_NOTE = 0.5;
    const QUARTER_NOTE = 1;
    const DOTTED_QUARTER = 1.5;
    const SIXTEENTH_NOTE = 0.25;

    describe("when swing is disabled", () => {
      it("should return original duration unchanged", () => {
        expect(getSwungDuration(0, EIGHTH_NOTE, 4, false)).toBe(EIGHTH_NOTE);
        expect(getSwungDuration(0.5, EIGHTH_NOTE, 4, false)).toBe(EIGHTH_NOTE);
        expect(getSwungDuration(0, QUARTER_NOTE, 4, false)).toBe(QUARTER_NOTE);
        expect(getSwungDuration(0, DOTTED_QUARTER, 4, false)).toBe(DOTTED_QUARTER);
      });
    });

    describe("when swing is enabled", () => {
      const SWING_EXTENSION = SWING_RATIO - 0.5; // ~0.167

      describe("with eighth notes (4/4 time)", () => {
        it("should lengthen on-beat eighth notes", () => {
          // On-beat eighths end at off-beat (0.5), extend to swung position
          const swungDuration = getSwungDuration(0, EIGHTH_NOTE, 4, true);
          expect(swungDuration).toBeCloseTo(EIGHTH_NOTE + SWING_EXTENSION);
          expect(swungDuration).toBeGreaterThan(EIGHTH_NOTE);
        });

        it("should shorten off-beat eighth notes", () => {
          // Off-beat eighths started late, shorten to end on beat
          const swungDuration = getSwungDuration(0.5, EIGHTH_NOTE, 4, true);
          expect(swungDuration).toBeCloseTo(EIGHTH_NOTE - SWING_EXTENSION);
          expect(swungDuration).toBeLessThan(EIGHTH_NOTE);
        });

        it("should preserve total duration of beat pair", () => {
          // On-beat + off-beat should equal 1 beat
          const onBeatDuration = getSwungDuration(0, EIGHTH_NOTE, 4, true);
          const offBeatDuration = getSwungDuration(0.5, EIGHTH_NOTE, 4, true);
          expect(onBeatDuration + offBeatDuration).toBeCloseTo(1.0);
        });

        it("should handle multiple beats correctly", () => {
          // Beat 2 (on-beat)
          const beat2 = getSwungDuration(2, EIGHTH_NOTE, 4, true);
          expect(beat2).toBeGreaterThan(EIGHTH_NOTE);

          // Beat 2.5 (off-beat)
          const beat2Half = getSwungDuration(2.5, EIGHTH_NOTE, 4, true);
          expect(beat2Half).toBeLessThan(EIGHTH_NOTE);
        });
      });

      describe("with dotted quarter notes", () => {
        it("should extend dotted quarter that ends on off-beat", () => {
          // Dotted quarter at beat 0, duration 1.5, ends at beat 1.5 (off-beat)
          // Should be extended so next note starts at swung position
          const swungDuration = getSwungDuration(0, DOTTED_QUARTER, 4, true);
          expect(swungDuration).toBeCloseTo(DOTTED_QUARTER + SWING_EXTENSION);
          expect(swungDuration).toBeGreaterThan(DOTTED_QUARTER);
        });

        it("should swing eighth after dotted quarter correctly", () => {
          // The eighth at position 1.5 is off-beat, should be shortened
          const swungDuration = getSwungDuration(1.5, EIGHTH_NOTE, 4, true);
          expect(swungDuration).toBeCloseTo(EIGHTH_NOTE - SWING_EXTENSION);
          expect(swungDuration).toBeLessThan(EIGHTH_NOTE);
        });

        it("should preserve total duration of dotted-quarter + eighth pair", () => {
          // Dotted quarter (1.5) + eighth (0.5) = 2 beats
          // Both get adjusted but total should still be 2 beats
          const dottedQuarterSwung = getSwungDuration(0, DOTTED_QUARTER, 4, true);
          const eighthSwung = getSwungDuration(1.5, EIGHTH_NOTE, 4, true);
          expect(dottedQuarterSwung + eighthSwung).toBeCloseTo(2.0);
        });
      });

      describe("with quarter notes", () => {
        it("should not swing quarter notes (on-beat to on-beat)", () => {
          // Quarter at beat 0, ends at beat 1 (both on-beat)
          expect(getSwungDuration(0, QUARTER_NOTE, 4, true)).toBe(QUARTER_NOTE);
          expect(getSwungDuration(1, QUARTER_NOTE, 4, true)).toBe(QUARTER_NOTE);
        });
      });

      describe("with sixteenth notes", () => {
        it("should not swing sixteenth notes (don't align with off-beat)", () => {
          // Sixteenths don't end on 0.5 boundaries
          expect(getSwungDuration(0, SIXTEENTH_NOTE, 4, true)).toBe(SIXTEENTH_NOTE);
          expect(getSwungDuration(0.25, SIXTEENTH_NOTE, 4, true)).toBe(SIXTEENTH_NOTE);
        });
      });

      describe("in 6/8 time", () => {
        it("should swing eighth note subdivisions", () => {
          // In 6/8 with beatUnit=8, half-beat is still 0.5
          const onBeat = getSwungDuration(0, EIGHTH_NOTE, 8, true);
          const offBeat = getSwungDuration(0.5, EIGHTH_NOTE, 8, true);

          expect(onBeat).toBeGreaterThan(EIGHTH_NOTE);
          expect(offBeat).toBeLessThan(EIGHTH_NOTE);
          expect(onBeat + offBeat).toBeCloseTo(1.0);
        });
      });
    });

    describe("swing ratio", () => {
      it("should use 2:1 swing ratio", () => {
        // SWING_RATIO should be 2/3
        expect(SWING_RATIO).toBeCloseTo(2 / 3);
      });

      it("on-beat eighth should be approximately double off-beat", () => {
        const onBeat = getSwungDuration(0, EIGHTH_NOTE, 4, true);
        const offBeat = getSwungDuration(0.5, EIGHTH_NOTE, 4, true);

        // 2:1 ratio means on-beat / off-beat ≈ 2
        expect(onBeat / offBeat).toBeCloseTo(2);
      });
    });
  });
});

/**
 * Tune Composer Storage Service Tests
 *
 * Tests for score persistence including per-measure properties.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { tuneComposerStorageService } from "../src/features/tune-composer/services/tuneComposerStorageService";
import {
  createScore,
  createMeasure,
} from "../src/features/tune-composer/types";
import type { TuneComposerScore } from "../src/features/tune-composer/types";

// =============================================================================
// Test Helpers
// =============================================================================

function createTestScore(
  options: Partial<TuneComposerScore> = {},
): TuneComposerScore {
  return {
    ...createScore(),
    ...options,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("tuneComposerStorageService", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("saveScore and loadScore", () => {
    it("should persist per-measure time signature", async () => {
      const score = createTestScore({
        measures: [
          { ...createMeasure(), timeSignature: { beats: 3, beatUnit: 4 } },
          { ...createMeasure() },
        ],
      });

      await tuneComposerStorageService.saveScore(score);
      const loaded = await tuneComposerStorageService.loadScore(score.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.measures[0].timeSignature).toEqual({
        beats: 3,
        beatUnit: 4,
      });
      expect(loaded!.measures[1].timeSignature).toBeUndefined();
    });

    it("should persist per-measure key signature", async () => {
      const score = createTestScore({
        measures: [
          { ...createMeasure(), keySignature: -3 },
          { ...createMeasure() },
        ],
      });

      await tuneComposerStorageService.saveScore(score);
      const loaded = await tuneComposerStorageService.loadScore(score.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.measures[0].keySignature).toBe(-3);
      expect(loaded!.measures[1].keySignature).toBeUndefined();
    });

    it("should persist per-measure tempo", async () => {
      const score = createTestScore({
        measures: [{ ...createMeasure(), tempo: 100 }, { ...createMeasure() }],
      });

      await tuneComposerStorageService.saveScore(score);
      const loaded = await tuneComposerStorageService.loadScore(score.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.measures[0].tempo).toBe(100);
      expect(loaded!.measures[1].tempo).toBeUndefined();
    });

    it("should persist per-measure tempo beat unit", async () => {
      const score = createTestScore({
        measures: [
          { ...createMeasure(), tempoBeatUnit: "dotted-quarter" },
          { ...createMeasure() },
        ],
      });

      await tuneComposerStorageService.saveScore(score);
      const loaded = await tuneComposerStorageService.loadScore(score.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.measures[0].tempoBeatUnit).toBe("dotted-quarter");
      expect(loaded!.measures[1].tempoBeatUnit).toBeUndefined();
    });

    it("should persist per-measure tempo modulation", async () => {
      const score = createTestScore({
        measures: [
          {
            ...createMeasure(),
            tempoModulation: { fromUnit: "quarter", toUnit: "dotted-quarter" },
          },
          { ...createMeasure() },
        ],
      });

      await tuneComposerStorageService.saveScore(score);
      const loaded = await tuneComposerStorageService.loadScore(score.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.measures[0].tempoModulation).toEqual({
        fromUnit: "quarter",
        toUnit: "dotted-quarter",
      });
      expect(loaded!.measures[1].tempoModulation).toBeUndefined();
    });

    it("should persist multiple per-measure overrides on the same measure", async () => {
      const score = createTestScore({
        measures: [
          {
            ...createMeasure(),
            timeSignature: { beats: 6, beatUnit: 8 },
            keySignature: 2,
            tempo: 140,
            tempoBeatUnit: "dotted-quarter",
          },
          { ...createMeasure() },
        ],
      });

      await tuneComposerStorageService.saveScore(score);
      const loaded = await tuneComposerStorageService.loadScore(score.id);

      expect(loaded).not.toBeNull();
      const measure = loaded!.measures[0];
      expect(measure.timeSignature).toEqual({ beats: 6, beatUnit: 8 });
      expect(measure.keySignature).toBe(2);
      expect(measure.tempo).toBe(140);
      expect(measure.tempoBeatUnit).toBe("dotted-quarter");
    });
  });

  describe("autosave", () => {
    it("should persist per-measure time signature in autosave", async () => {
      const score = createTestScore({
        measures: [
          { ...createMeasure(), timeSignature: { beats: 5, beatUnit: 4 } },
        ],
      });

      await tuneComposerStorageService.autosave(score);
      const loaded = await tuneComposerStorageService.loadAutosave();

      expect(loaded).not.toBeNull();
      expect(loaded!.measures[0].timeSignature).toEqual({
        beats: 5,
        beatUnit: 4,
      });
    });
  });
});

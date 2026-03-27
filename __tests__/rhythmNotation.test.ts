/**
 * Tests for rhythmNotation utilities
 * Tests duration conversion, triplet detection, and beam computation
 */
import {
  durationToType,
  EIGHTH_TRIPLET_DURATION,
  QUARTER_TRIPLET_DURATION,
  isEighthTriplet,
  isQuarterTriplet,
  isTripletDuration,
  getTripletInfo,
  isBeamableDuration,
  isSwingDuration,
  computeBeamGroups,
} from "../src/utils/rhythmNotation";

describe("rhythmNotation", () => {
  describe("durationToType", () => {
    it('returns "whole" for 4 beats', () => {
      expect(durationToType(4)).toBe("whole");
    });

    it('returns "half" for 2 beats', () => {
      expect(durationToType(2)).toBe("half");
    });

    it('returns "quarter" for 1 beat', () => {
      expect(durationToType(1)).toBe("quarter");
    });

    it('returns "eighth" for 0.5 beats', () => {
      expect(durationToType(0.5)).toBe("eighth");
    });

    it('returns "16th" for 0.25 beats', () => {
      expect(durationToType(0.25)).toBe("16th");
    });

    it('returns "32nd" for very short durations', () => {
      expect(durationToType(0.125)).toBe("32nd");
    });

    it('returns "eighth" for swing long duration (2/3 beat)', () => {
      expect(durationToType(2.0 / 3.0)).toBe("eighth");
    });

    it('returns "eighth" for swing short duration (1/3 beat)', () => {
      expect(durationToType(1.0 / 3.0)).toBe("eighth");
    });

    it('returns "quarter" for quarter triplet (2/3 beat)', () => {
      expect(durationToType(2.0 / 3.0)).toBe("eighth");
    });

    it('returns "16th" for sixteenth triplet (1/6 beat)', () => {
      expect(durationToType(1.0 / 6.0)).toBe("16th");
    });

    it("handles values greater than 4", () => {
      expect(durationToType(8)).toBe("whole");
    });
  });

  describe("triplet constants", () => {
    it("has correct eighth triplet duration", () => {
      expect(EIGHTH_TRIPLET_DURATION).toBeCloseTo(1 / 3, 6);
    });

    it("has correct quarter triplet duration", () => {
      expect(QUARTER_TRIPLET_DURATION).toBeCloseTo(2 / 3, 6);
    });
  });

  describe("isEighthTriplet", () => {
    it("returns true for 1/3 beat", () => {
      expect(isEighthTriplet(1 / 3)).toBe(true);
    });

    it("returns true for values close to 1/3 beat", () => {
      expect(isEighthTriplet(0.333)).toBe(true);
    });

    it("returns false for quarter note", () => {
      expect(isEighthTriplet(1)).toBe(false);
    });

    it("returns false for quarter triplet", () => {
      expect(isEighthTriplet(2 / 3)).toBe(false);
    });
  });

  describe("isQuarterTriplet", () => {
    it("returns true for 2/3 beat", () => {
      expect(isQuarterTriplet(2 / 3)).toBe(true);
    });

    it("returns true for values close to 2/3 beat", () => {
      expect(isQuarterTriplet(0.667)).toBe(true);
    });

    it("returns false for half note", () => {
      expect(isQuarterTriplet(2)).toBe(false);
    });

    it("returns false for eighth triplet", () => {
      expect(isQuarterTriplet(1 / 3)).toBe(false);
    });
  });

  describe("isTripletDuration", () => {
    it("returns true for eighth triplet", () => {
      expect(isTripletDuration(1 / 3)).toBe(true);
    });

    it("returns true for quarter triplet", () => {
      expect(isTripletDuration(2 / 3)).toBe(true);
    });

    it("returns false for standard durations", () => {
      expect(isTripletDuration(1)).toBe(false);
      expect(isTripletDuration(0.5)).toBe(false);
      expect(isTripletDuration(2)).toBe(false);
    });
  });

  describe("getTripletInfo", () => {
    it("returns correct info for eighth triplet", () => {
      const info = getTripletInfo(1 / 3);
      expect(info.isTriplet).toBe(true);
      expect(info.noteType).toBe("eighth");
      expect(info.actualNotes).toBe(3);
      expect(info.normalNotes).toBe(2);
    });

    it("returns correct info for quarter triplet", () => {
      const info = getTripletInfo(2 / 3);
      expect(info.isTriplet).toBe(true);
      expect(info.noteType).toBe("quarter");
      expect(info.actualNotes).toBe(3);
      expect(info.normalNotes).toBe(2);
    });

    it("returns non-triplet info for standard duration", () => {
      const info = getTripletInfo(1);
      expect(info.isTriplet).toBe(false);
      expect(info.noteType).toBe("");
      expect(info.actualNotes).toBe(0);
      expect(info.normalNotes).toBe(0);
    });
  });

  describe("isBeamableDuration", () => {
    it("returns true for eighth notes", () => {
      expect(isBeamableDuration(0.5)).toBe(true);
    });

    it("returns true for sixteenth notes", () => {
      expect(isBeamableDuration(0.25)).toBe(true);
    });

    it("returns true for thirty-second notes", () => {
      expect(isBeamableDuration(0.125)).toBe(true);
    });

    it("returns false for quarter notes", () => {
      expect(isBeamableDuration(1)).toBe(false);
    });

    it("returns false for half notes", () => {
      expect(isBeamableDuration(2)).toBe(false);
    });

    it("returns false for whole notes", () => {
      expect(isBeamableDuration(4)).toBe(false);
    });
  });

  describe("isSwingDuration", () => {
    it("returns true for swing long (2/3 beat)", () => {
      expect(isSwingDuration(2 / 3)).toBe(true);
    });

    it("returns true for swing short (1/3 beat)", () => {
      expect(isSwingDuration(1 / 3)).toBe(true);
    });

    it("returns false for standard eighth", () => {
      expect(isSwingDuration(0.5)).toBe(false);
    });

    it("returns false for quarter note", () => {
      expect(isSwingDuration(1)).toBe(false);
    });
  });

  describe("computeBeamGroups", () => {
    it("returns empty array for empty input", () => {
      expect(computeBeamGroups([])).toEqual([]);
    });

    it("handles single non-beamable note", () => {
      const events = [
        { midi: 60, duration_beats: 1, offset_beats: 0, velocity: 100 },
      ];
      const result = computeBeamGroups(events);
      expect(result.length).toBe(1);
      expect(result[0].beam1).toBeNull();
    });

    it("beams two eighth notes together", () => {
      const events = [
        { midi: 60, duration_beats: 0.5, offset_beats: 0, velocity: 100 },
        { midi: 62, duration_beats: 0.5, offset_beats: 0.5, velocity: 100 },
      ];
      const result = computeBeamGroups(events);
      expect(result.length).toBe(2);
      expect(result[0].beam1).toBe("begin");
      expect(result[1].beam1).toBe("end");
    });

    it("handles swing rhythm with forced beaming", () => {
      const events = [
        { midi: 60, duration_beats: 2 / 3, offset_beats: 0, velocity: 100 },
        { midi: 62, duration_beats: 1 / 3, offset_beats: 2 / 3, velocity: 100 },
      ];
      const result = computeBeamGroups(events, true);
      expect(result.length).toBe(2);
      expect(result[0].beam1).toBe("begin");
      expect(result[1].beam1).toBe("end");
    });

    it("handles triplet notes with beam info", () => {
      const events = [
        { midi: 60, duration_beats: 1 / 3, offset_beats: 0, velocity: 100 },
        { midi: 62, duration_beats: 1 / 3, offset_beats: 1 / 3, velocity: 100 },
        { midi: 64, duration_beats: 1 / 3, offset_beats: 2 / 3, velocity: 100 },
      ];
      const result = computeBeamGroups(events);
      expect(result.length).toBe(3);
      expect(result[0].tripletStart).toBe(true);
      expect(result[2].tripletStop).toBe(true);
    });

    it("handles mixed durations", () => {
      const events = [
        { midi: 60, duration_beats: 1, offset_beats: 0, velocity: 100 },
        { midi: 62, duration_beats: 0.5, offset_beats: 1, velocity: 100 },
        { midi: 64, duration_beats: 0.5, offset_beats: 1.5, velocity: 100 },
      ];
      const result = computeBeamGroups(events);
      expect(result.length).toBe(3);
      expect(result[0].beam1).toBeNull();
      expect(result[1].beam1).toBe("begin");
      expect(result[2].beam1).toBe("end");
    });

    it("groups sixteenth notes with beam2", () => {
      const events = [
        { midi: 60, duration_beats: 0.25, offset_beats: 0, velocity: 100 },
        { midi: 62, duration_beats: 0.25, offset_beats: 0.25, velocity: 100 },
        { midi: 64, duration_beats: 0.25, offset_beats: 0.5, velocity: 100 },
        { midi: 65, duration_beats: 0.25, offset_beats: 0.75, velocity: 100 },
      ];
      const result = computeBeamGroups(events);
      expect(result[0].beam1).toBe("begin");
      expect(result[0].beam2).toBe("begin");
      expect(result[3].beam1).toBe("end");
      expect(result[3].beam2).toBe("end");
    });

    it("auto-detects swing rhythm", () => {
      const events = [
        { midi: 60, duration_beats: 2 / 3, offset_beats: 0, velocity: 100 },
        { midi: 62, duration_beats: 1 / 3, offset_beats: 2 / 3, velocity: 100 },
        { midi: 64, duration_beats: 2 / 3, offset_beats: 1, velocity: 100 },
        { midi: 65, duration_beats: 1 / 3, offset_beats: 5 / 3, velocity: 100 },
      ];
      const result = computeBeamGroups(events);
      // Swing pairs should be beamed
      expect(result[0].beam1).toBe("begin");
      expect(result[1].beam1).toBe("end");
      expect(result[2].beam1).toBe("begin");
      expect(result[3].beam1).toBe("end");
    });
  });
});

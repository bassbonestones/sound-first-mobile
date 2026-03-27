/**
 * Tests for halfRestConfig
 * Tests half rest exercise configuration and helper functions
 */
import {
  HALF_REST_CONFIG,
  HALF_REST_FOCUS_CARD,
  HALF_REST_MINI_CARD,
  HALF_REST_THRESHOLDS,
  HALF_REST_BEATS,
  HALF_REST_AUDIO_THRESHOLDS,
  generateHalfRestNoteInfo,
  shouldBeatHaveSound,
  isRestBeat,
  getMeasureForBeat,
  getMeasureBeat,
  isAccentBeat,
  isEndBeat,
  getHalfRestCursorConfig,
  generateHalfRestPatternMusicXML,
  analyzeHalfRestPerformance,
} from "../../src/screens/Session/components/exercises/configs/halfRestConfig";

describe("halfRestConfig", () => {
  describe("HALF_REST_CONFIG", () => {
    it("has correct beat configuration", () => {
      expect(HALF_REST_CONFIG.beatsPerRest).toBe(2);
      expect(HALF_REST_CONFIG.beatsPerNote).toBe(2);
      expect(HALF_REST_CONFIG.totalBeats).toBe(7);
      expect(HALF_REST_CONFIG.restType).toBe("half");
    });

    it("has correct tempo", () => {
      expect(HALF_REST_CONFIG.defaultTempo).toBe(60);
    });

    it("has correct flags", () => {
      expect(HALF_REST_CONFIG.hasSubdivision).toBe(false);
      expect(HALF_REST_CONFIG.hasDronePhase).toBe(false);
    });

    it("has correct beat pattern", () => {
      expect(HALF_REST_CONFIG.beats).toHaveLength(7);
      // First two beats are notes (half note)
      expect(HALF_REST_CONFIG.beats[0].isNote).toBe(true);
      expect(HALF_REST_CONFIG.beats[1].isNote).toBe(true);
      // Next two beats are rests (half rest)
      expect(HALF_REST_CONFIG.beats[2].isNote).toBe(false);
      expect(HALF_REST_CONFIG.beats[3].isNote).toBe(false);
      // Next two beats are notes (half note)
      expect(HALF_REST_CONFIG.beats[4].isNote).toBe(true);
      expect(HALF_REST_CONFIG.beats[5].isNote).toBe(true);
      // Last beat is end marker
      expect(HALF_REST_CONFIG.beats[6].isNote).toBe(false);
    });
  });

  describe("HALF_REST_FOCUS_CARD", () => {
    it("has correct title and symbol", () => {
      expect(HALF_REST_FOCUS_CARD.title).toBe("Half Rest");
      expect(HALF_REST_FOCUS_CARD.symbol).toBe("half_rest");
    });

    it("has description and cue", () => {
      expect(HALF_REST_FOCUS_CARD.description).toContain("2 beats of silence");
      expect(HALF_REST_FOCUS_CARD.cue).toContain("hat");
    });

    it("has details array", () => {
      expect(HALF_REST_FOCUS_CARD.details).toBeInstanceOf(Array);
      expect(HALF_REST_FOCUS_CARD.details.length).toBeGreaterThan(0);
    });
  });

  describe("HALF_REST_MINI_CARD", () => {
    it("has title and text", () => {
      expect(HALF_REST_MINI_CARD.title).toBe("Half Rest");
      expect(HALF_REST_MINI_CARD.text).toContain("2 beats");
    });
  });

  describe("HALF_REST_THRESHOLDS", () => {
    it("has required threshold values", () => {
      expect(HALF_REST_THRESHOLDS.sustainThreshold).toBe(0.75);
      expect(HALF_REST_THRESHOLDS.silenceThreshold).toBe(0.4);
      expect(HALF_REST_THRESHOLDS.pitchSuccessRatio).toBe(0.3);
    });

    it("thresholds are between 0 and 1", () => {
      expect(HALF_REST_THRESHOLDS.sustainThreshold).toBeGreaterThanOrEqual(0);
      expect(HALF_REST_THRESHOLDS.sustainThreshold).toBeLessThanOrEqual(1);
      expect(HALF_REST_THRESHOLDS.silenceThreshold).toBeGreaterThanOrEqual(0);
      expect(HALF_REST_THRESHOLDS.silenceThreshold).toBeLessThanOrEqual(1);
      expect(HALF_REST_THRESHOLDS.pitchSuccessRatio).toBeGreaterThanOrEqual(0);
      expect(HALF_REST_THRESHOLDS.pitchSuccessRatio).toBeLessThanOrEqual(1);
    });
  });

  describe("HALF_REST_BEATS", () => {
    it("has 7 beats", () => {
      expect(HALF_REST_BEATS).toHaveLength(7);
    });

    it("has correct beat numbers", () => {
      HALF_REST_BEATS.forEach((beat, idx) => {
        expect(beat.beat).toBe(idx + 1);
      });
    });

    it("has correct measure assignments", () => {
      // Beats 1-4 in measure 1
      expect(HALF_REST_BEATS[0].measure).toBe(1);
      expect(HALF_REST_BEATS[3].measure).toBe(1);
      // Beats 5-7 in measure 2
      expect(HALF_REST_BEATS[4].measure).toBe(2);
      expect(HALF_REST_BEATS[6].measure).toBe(2);
    });
  });

  describe("HALF_REST_AUDIO_THRESHOLDS", () => {
    it("mirrors HALF_REST_THRESHOLDS values", () => {
      expect(HALF_REST_AUDIO_THRESHOLDS.sustainThreshold).toBe(
        HALF_REST_THRESHOLDS.sustainThreshold,
      );
      expect(HALF_REST_AUDIO_THRESHOLDS.silenceThreshold).toBe(
        HALF_REST_THRESHOLDS.silenceThreshold,
      );
      expect(HALF_REST_AUDIO_THRESHOLDS.pitchSuccessRatio).toBe(
        HALF_REST_THRESHOLDS.pitchSuccessRatio,
      );
    });
  });

  describe("generateHalfRestNoteInfo", () => {
    it("generates note info for valid note", () => {
      const info = generateHalfRestNoteInfo("C4");
      expect(info).not.toBeNull();
      expect(info?.letter).toBe("C");
      expect(info?.octave).toBe(4);
      expect(info?.midi).toBe(60);
      expect(info?.frequency).toBeCloseTo(261.63, 1);
    });

    it("handles sharps", () => {
      const info = generateHalfRestNoteInfo("F#4");
      expect(info).not.toBeNull();
      expect(info?.letter).toBe("F");
      expect(info?.accidental).toBe("#");
      expect(info?.octave).toBe(4);
    });

    it("handles flats", () => {
      const info = generateHalfRestNoteInfo("Bb3");
      expect(info).not.toBeNull();
      expect(info?.letter).toBe("B");
      expect(info?.accidental).toBe("b");
      expect(info?.octave).toBe(3);
    });

    it("returns null for invalid note", () => {
      const info = generateHalfRestNoteInfo("invalid");
      expect(info).toBeNull();
    });
  });

  describe("shouldBeatHaveSound", () => {
    it("returns true for half note beats (1, 2, 5, 6)", () => {
      expect(shouldBeatHaveSound(1)).toBe(true);
      expect(shouldBeatHaveSound(2)).toBe(true);
      expect(shouldBeatHaveSound(5)).toBe(true);
      expect(shouldBeatHaveSound(6)).toBe(true);
    });

    it("returns false for rest beats (3, 4)", () => {
      expect(shouldBeatHaveSound(3)).toBe(false);
      expect(shouldBeatHaveSound(4)).toBe(false);
    });

    it("returns false for end beat (7)", () => {
      expect(shouldBeatHaveSound(7)).toBe(false);
    });

    it("returns false for out of range beats", () => {
      expect(shouldBeatHaveSound(0)).toBe(false);
      expect(shouldBeatHaveSound(8)).toBe(false);
      expect(shouldBeatHaveSound(-1)).toBe(false);
    });
  });

  describe("isRestBeat", () => {
    it("returns true for rest beats (3, 4)", () => {
      expect(isRestBeat(3)).toBe(true);
      expect(isRestBeat(4)).toBe(true);
    });

    it("returns false for note beats", () => {
      expect(isRestBeat(1)).toBe(false);
      expect(isRestBeat(2)).toBe(false);
      expect(isRestBeat(5)).toBe(false);
      expect(isRestBeat(6)).toBe(false);
    });

    it("returns false for end beat", () => {
      expect(isRestBeat(7)).toBe(false);
    });
  });

  describe("getMeasureForBeat", () => {
    it("returns measure 1 for beats 1-4", () => {
      expect(getMeasureForBeat(1)).toBe(1);
      expect(getMeasureForBeat(2)).toBe(1);
      expect(getMeasureForBeat(3)).toBe(1);
      expect(getMeasureForBeat(4)).toBe(1);
    });

    it("returns measure 2 for beats 5-7", () => {
      expect(getMeasureForBeat(5)).toBe(2);
      expect(getMeasureForBeat(6)).toBe(2);
      expect(getMeasureForBeat(7)).toBe(2);
    });

    it("returns 0 for out of range beats", () => {
      expect(getMeasureForBeat(0)).toBe(0);
      expect(getMeasureForBeat(8)).toBe(0);
    });
  });

  describe("getMeasureBeat", () => {
    it("returns correct beat within measure 1", () => {
      expect(getMeasureBeat(1)).toBe(1);
      expect(getMeasureBeat(2)).toBe(2);
      expect(getMeasureBeat(3)).toBe(3);
      expect(getMeasureBeat(4)).toBe(4);
    });

    it("returns correct beat within measure 2", () => {
      expect(getMeasureBeat(5)).toBe(1);
      expect(getMeasureBeat(6)).toBe(2);
      expect(getMeasureBeat(7)).toBe(3);
    });

    it("returns 0 for out of range beats", () => {
      expect(getMeasureBeat(0)).toBe(0);
      expect(getMeasureBeat(8)).toBe(0);
    });
  });

  describe("isAccentBeat", () => {
    it("returns true for first beat of each measure", () => {
      expect(isAccentBeat(1)).toBe(true);
      expect(isAccentBeat(5)).toBe(true);
    });

    it("returns false for non-accent beats", () => {
      expect(isAccentBeat(2)).toBe(false);
      expect(isAccentBeat(3)).toBe(false);
      expect(isAccentBeat(4)).toBe(false);
      expect(isAccentBeat(6)).toBe(false);
      expect(isAccentBeat(7)).toBe(false);
    });
  });

  describe("isEndBeat", () => {
    it("returns true for beat 7", () => {
      expect(isEndBeat(7)).toBe(true);
    });

    it("returns false for non-end beats", () => {
      expect(isEndBeat(1)).toBe(false);
      expect(isEndBeat(6)).toBe(false);
      expect(isEndBeat(8)).toBe(false);
    });
  });

  describe("getHalfRestCursorConfig", () => {
    it("returns correct note index for first note (beats 1-2)", () => {
      const config1 = getHalfRestCursorConfig(1, 1);
      expect(config1.noteIndex).toBe(0);

      const config2 = getHalfRestCursorConfig(2, 1);
      expect(config2.noteIndex).toBe(0);
    });

    it("returns correct note index for first rest (beats 3-4)", () => {
      const config3 = getHalfRestCursorConfig(3, 1);
      expect(config3.noteIndex).toBe(1);

      const config4 = getHalfRestCursorConfig(4, 1);
      expect(config4.noteIndex).toBe(1);
    });

    it("returns correct note index for second note (beats 5-6)", () => {
      const config5 = getHalfRestCursorConfig(5, 2);
      expect(config5.noteIndex).toBe(2);

      const config6 = getHalfRestCursorConfig(6, 2);
      expect(config6.noteIndex).toBe(2);
    });

    it("returns null for beat 7 (end)", () => {
      const config7 = getHalfRestCursorConfig(7, 2);
      expect(config7.noteIndex).toBeNull();
    });

    it("returns correct note positions array", () => {
      const config = getHalfRestCursorConfig(1, 1);
      expect(config.notePositions).toHaveLength(4);
      expect(config.highlightWidth).toBe(50);
    });
  });

  describe("generateHalfRestPatternMusicXML", () => {
    it("generates valid MusicXML for natural note", () => {
      const xml = generateHalfRestPatternMusicXML("C4");
      expect(xml).not.toBeNull();
      expect(xml).toContain("<step>C</step>");
      expect(xml).toContain("<octave>4</octave>");
      expect(xml).toContain("<type>half</type>");
      expect(xml).toContain("<rest/>");
    });

    it("generates MusicXML with flat accidental", () => {
      const xml = generateHalfRestPatternMusicXML("Bb3");
      expect(xml).not.toBeNull();
      expect(xml).toContain("<step>B</step>");
      expect(xml).toContain("<alter>-1</alter>");
      expect(xml).toContain("<accidental>flat</accidental>");
    });

    it("generates MusicXML with sharp accidental", () => {
      const xml = generateHalfRestPatternMusicXML("F#4");
      expect(xml).not.toBeNull();
      expect(xml).toContain("<step>F</step>");
      expect(xml).toContain("<alter>1</alter>");
      expect(xml).toContain("<accidental>sharp</accidental>");
    });

    it("generates MusicXML with treble clef by default", () => {
      const xml = generateHalfRestPatternMusicXML("C4");
      expect(xml).toContain("<sign>G</sign>");
      expect(xml).toContain("<line>2</line>");
    });

    it("generates MusicXML with bass clef when specified", () => {
      const xml = generateHalfRestPatternMusicXML("C3", "bass");
      expect(xml).toContain("<sign>F</sign>");
      expect(xml).toContain("<line>4</line>");
    });

    it("returns null for invalid note", () => {
      const xml = generateHalfRestPatternMusicXML("invalid");
      expect(xml).toBeNull();
    });

    it("generates two measures", () => {
      const xml = generateHalfRestPatternMusicXML("C4");
      expect(xml).toContain('measure number="1"');
      expect(xml).toContain('measure number="2"');
    });
  });

  describe("analyzeHalfRestPerformance", () => {
    const perfectPerformance = {
      totalSoundingCount: 100,
      onPitchCount: 80,
      hasHitTargetPitch: true,
      beatSoundPercentages: [0.9, 0.9, 0.1, 0.1, 0.9, 0.9, 0.1],
      startedEarly: false,
    };

    it("returns success for perfect performance", () => {
      const result = analyzeHalfRestPerformance(perfectPerformance);
      expect(result.success).toBe(true);
      expect(result.pitchOk).toBe(true);
      expect(result.rhythmOk).toBe(true);
    });

    it("returns failure when no sound detected", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        totalSoundingCount: 0,
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe("No sound detected");
    });

    it("returns failure when started early", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        startedEarly: true,
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Wait for beat ONE");
    });

    it("returns failure when first note not sustained", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        beatSoundPercentages: [0.3, 0.3, 0.1, 0.1, 0.9, 0.9, 0.1],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Hold the first half note");
    });

    it("returns failure when rest is not silent", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        beatSoundPercentages: [0.9, 0.9, 0.8, 0.8, 0.9, 0.9, 0.1],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Be silent during the half rest");
    });

    it("returns failure when second note not sustained", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        beatSoundPercentages: [0.9, 0.9, 0.1, 0.1, 0.3, 0.3, 0.1],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Hold the second half note");
    });

    it("returns failure when not stopped on beat 7", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        beatSoundPercentages: [0.9, 0.9, 0.1, 0.1, 0.9, 0.9, 0.8],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Stop at beat 3");
    });

    it("returns pitch feedback when only pitch is wrong", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        hasHitTargetPitch: false,
        onPitchCount: 10,
      });
      expect(result.pitchOk).toBe(false);
      expect(result.rhythmOk).toBe(true);
      expect(result.message).toContain("match the pitch");
    });

    it("returns combined feedback when both pitch and rhythm wrong", () => {
      const result = analyzeHalfRestPerformance({
        ...perfectPerformance,
        hasHitTargetPitch: false,
        onPitchCount: 10,
        startedEarly: true,
      });
      expect(result.pitchOk).toBe(false);
      expect(result.rhythmOk).toBe(false);
      expect(result.message).toContain("pitch and follow the rhythm");
    });
  });
});

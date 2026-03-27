import {
  QUARTER_REST_CONFIG,
  QUARTER_REST_FOCUS_CARD,
  QUARTER_REST_MINI_CARD,
  QUARTER_REST_THRESHOLDS,
  QUARTER_REST_BEATS,
  QUARTER_REST_AUDIO_THRESHOLDS,
  generateQuarterRestNoteInfo,
  shouldBeatHaveSound,
  isRestBeat,
  getMeasureForBeat,
  getMeasureBeat,
  isAccentBeat,
  getQuarterRestCursorConfig,
  generateQuarterRestPatternMusicXML,
  analyzeQuarterRestPerformance,
} from "../../src/screens/Session/components/exercises/configs/quarterRestConfig";

describe("quarterRestConfig", () => {
  describe("QUARTER_REST_CONFIG", () => {
    it("has correct beat configuration", () => {
      expect(QUARTER_REST_CONFIG.beatsPerRest).toBe(1);
      expect(QUARTER_REST_CONFIG.beatsPerNote).toBe(1);
      expect(QUARTER_REST_CONFIG.totalBeats).toBe(8);
    });

    it("has correct rest type and tempo", () => {
      expect(QUARTER_REST_CONFIG.restType).toBe("quarter");
      expect(QUARTER_REST_CONFIG.defaultTempo).toBe(60);
    });

    it("has subdivision enabled", () => {
      expect(QUARTER_REST_CONFIG.hasSubdivision).toBe(true);
      expect(QUARTER_REST_CONFIG.hasDronePhase).toBe(false);
    });

    it("has 8 beats in alternating pattern", () => {
      expect(QUARTER_REST_CONFIG.beats).toHaveLength(8);
      // Odd beats are notes, even beats are rests
      expect(QUARTER_REST_CONFIG.beats[0].isNote).toBe(true);
      expect(QUARTER_REST_CONFIG.beats[1].isNote).toBe(false);
      expect(QUARTER_REST_CONFIG.beats[2].isNote).toBe(true);
      expect(QUARTER_REST_CONFIG.beats[3].isNote).toBe(false);
      expect(QUARTER_REST_CONFIG.beats[4].isNote).toBe(true);
      expect(QUARTER_REST_CONFIG.beats[5].isNote).toBe(false);
      expect(QUARTER_REST_CONFIG.beats[6].isNote).toBe(true);
      expect(QUARTER_REST_CONFIG.beats[7].isNote).toBe(false);
    });

    it("assigns correct measures to beats", () => {
      // First 4 beats in measure 1
      expect(QUARTER_REST_CONFIG.beats[0].measure).toBe(1);
      expect(QUARTER_REST_CONFIG.beats[3].measure).toBe(1);
      // Last 4 beats in measure 2
      expect(QUARTER_REST_CONFIG.beats[4].measure).toBe(2);
      expect(QUARTER_REST_CONFIG.beats[7].measure).toBe(2);
    });
  });

  describe("QUARTER_REST_FOCUS_CARD", () => {
    it("has correct title and symbol", () => {
      expect(QUARTER_REST_FOCUS_CARD.title).toBe("Quarter Rest");
      expect(QUARTER_REST_FOCUS_CARD.symbol).toBe("quarter_rest");
    });

    it("has description and cue", () => {
      expect(QUARTER_REST_FOCUS_CARD.description).toContain("1 beat");
      expect(QUARTER_REST_FOCUS_CARD.cue).toContain("squiggly");
    });

    it("has details array", () => {
      expect(Array.isArray(QUARTER_REST_FOCUS_CARD.details)).toBe(true);
      expect(QUARTER_REST_FOCUS_CARD.details.length).toBeGreaterThan(0);
    });
  });

  describe("QUARTER_REST_MINI_CARD", () => {
    it("has correct title and text", () => {
      expect(QUARTER_REST_MINI_CARD.title).toBe("Quarter Rest");
      expect(QUARTER_REST_MINI_CARD.text).toContain("1 beat");
    });
  });

  describe("QUARTER_REST_THRESHOLDS", () => {
    it("has valid threshold values", () => {
      expect(QUARTER_REST_THRESHOLDS.sustainThreshold).toBeGreaterThan(0);
      expect(QUARTER_REST_THRESHOLDS.sustainThreshold).toBeLessThan(1);
      expect(QUARTER_REST_THRESHOLDS.silenceThreshold).toBeGreaterThan(0);
      expect(QUARTER_REST_THRESHOLDS.silenceThreshold).toBeLessThan(1);
      expect(QUARTER_REST_THRESHOLDS.pitchSuccessRatio).toBeGreaterThan(0);
    });
  });

  describe("QUARTER_REST_BEATS", () => {
    it("has 8 beat configs", () => {
      expect(QUARTER_REST_BEATS).toHaveLength(8);
    });

    it("has alternating note/rest pattern", () => {
      QUARTER_REST_BEATS.forEach((beat, index) => {
        const expectedIsNote = index % 2 === 0;
        expect(beat.isNote).toBe(expectedIsNote);
      });
    });
  });

  describe("QUARTER_REST_AUDIO_THRESHOLDS", () => {
    it("matches main thresholds", () => {
      expect(QUARTER_REST_AUDIO_THRESHOLDS.sustainThreshold).toBe(
        QUARTER_REST_THRESHOLDS.sustainThreshold,
      );
      expect(QUARTER_REST_AUDIO_THRESHOLDS.silenceThreshold).toBe(
        QUARTER_REST_THRESHOLDS.silenceThreshold,
      );
    });
  });

  describe("generateQuarterRestNoteInfo", () => {
    it("returns note info for valid natural note", () => {
      const info = generateQuarterRestNoteInfo("C4");
      expect(info).not.toBeNull();
      expect(info!.letter).toBe("C");
      expect(info!.octave).toBe(4);
      expect(info!.accidental).toBe("");
      expect(info!.noteName).toBe("C4");
      expect(info!.midi).toBe(60);
    });

    it("returns note info for sharp note", () => {
      const info = generateQuarterRestNoteInfo("F#4");
      expect(info).not.toBeNull();
      expect(info!.letter).toBe("F");
      expect(info!.accidental).toBe("#");
    });

    it("returns note info for flat note", () => {
      const info = generateQuarterRestNoteInfo("Bb3");
      expect(info).not.toBeNull();
      expect(info!.letter).toBe("B");
      expect(info!.accidental).toBe("b");
    });

    it("returns null for invalid note", () => {
      const info = generateQuarterRestNoteInfo("invalid");
      expect(info).toBeNull();
    });

    it("calculates correct frequency", () => {
      const info = generateQuarterRestNoteInfo("A4");
      expect(info).not.toBeNull();
      expect(info!.frequency).toBeCloseTo(440, 0);
    });
  });

  describe("shouldBeatHaveSound", () => {
    it("returns true for odd beats (1,3,5,7)", () => {
      expect(shouldBeatHaveSound(1)).toBe(true);
      expect(shouldBeatHaveSound(3)).toBe(true);
      expect(shouldBeatHaveSound(5)).toBe(true);
      expect(shouldBeatHaveSound(7)).toBe(true);
    });

    it("returns false for even beats (2,4,6,8)", () => {
      expect(shouldBeatHaveSound(2)).toBe(false);
      expect(shouldBeatHaveSound(4)).toBe(false);
      expect(shouldBeatHaveSound(6)).toBe(false);
      expect(shouldBeatHaveSound(8)).toBe(false);
    });

    it("returns false for out-of-range beats", () => {
      expect(shouldBeatHaveSound(0)).toBe(false);
      expect(shouldBeatHaveSound(9)).toBe(false);
      expect(shouldBeatHaveSound(-1)).toBe(false);
    });
  });

  describe("isRestBeat", () => {
    it("returns true for even beats (2,4,6,8)", () => {
      expect(isRestBeat(2)).toBe(true);
      expect(isRestBeat(4)).toBe(true);
      expect(isRestBeat(6)).toBe(true);
      expect(isRestBeat(8)).toBe(true);
    });

    it("returns false for odd beats", () => {
      expect(isRestBeat(1)).toBe(false);
      expect(isRestBeat(3)).toBe(false);
      expect(isRestBeat(5)).toBe(false);
      expect(isRestBeat(7)).toBe(false);
    });

    it("returns false for out-of-range beats", () => {
      expect(isRestBeat(0)).toBe(false);
      expect(isRestBeat(9)).toBe(false);
    });
  });

  describe("getMeasureForBeat", () => {
    it("returns 1 for beats 1-4", () => {
      expect(getMeasureForBeat(1)).toBe(1);
      expect(getMeasureForBeat(2)).toBe(1);
      expect(getMeasureForBeat(3)).toBe(1);
      expect(getMeasureForBeat(4)).toBe(1);
    });

    it("returns 2 for beats 5-8", () => {
      expect(getMeasureForBeat(5)).toBe(2);
      expect(getMeasureForBeat(6)).toBe(2);
      expect(getMeasureForBeat(7)).toBe(2);
      expect(getMeasureForBeat(8)).toBe(2);
    });

    it("returns 0 for out-of-range beats", () => {
      expect(getMeasureForBeat(0)).toBe(0);
      expect(getMeasureForBeat(9)).toBe(0);
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
      expect(getMeasureBeat(8)).toBe(4);
    });

    it("returns 0 for out-of-range beats", () => {
      expect(getMeasureBeat(0)).toBe(0);
      expect(getMeasureBeat(9)).toBe(0);
    });
  });

  describe("isAccentBeat", () => {
    it("returns true for beat 1 and 5", () => {
      expect(isAccentBeat(1)).toBe(true);
      expect(isAccentBeat(5)).toBe(true);
    });

    it("returns false for non-accent beats", () => {
      expect(isAccentBeat(2)).toBe(false);
      expect(isAccentBeat(3)).toBe(false);
      expect(isAccentBeat(4)).toBe(false);
      expect(isAccentBeat(6)).toBe(false);
      expect(isAccentBeat(7)).toBe(false);
      expect(isAccentBeat(8)).toBe(false);
    });
  });

  describe("getQuarterRestCursorConfig", () => {
    it("returns correct note index for valid beats", () => {
      expect(getQuarterRestCursorConfig(1).noteIndex).toBe(0);
      expect(getQuarterRestCursorConfig(4).noteIndex).toBe(3);
      expect(getQuarterRestCursorConfig(8).noteIndex).toBe(7);
    });

    it("returns null noteIndex for out-of-range beats", () => {
      expect(getQuarterRestCursorConfig(0).noteIndex).toBeNull();
      expect(getQuarterRestCursorConfig(9).noteIndex).toBeNull();
    });

    it("returns 8 note positions", () => {
      const config = getQuarterRestCursorConfig(1);
      expect(config.notePositions).toHaveLength(8);
    });

    it("returns consistent highlight width", () => {
      expect(getQuarterRestCursorConfig(1).highlightWidth).toBe(25);
      expect(getQuarterRestCursorConfig(5).highlightWidth).toBe(25);
    });
  });

  describe("generateQuarterRestPatternMusicXML", () => {
    it("generates valid MusicXML for natural note", () => {
      const xml = generateQuarterRestPatternMusicXML("C4");
      expect(xml).not.toBeNull();
      expect(xml).toContain("<step>C</step>");
      expect(xml).toContain("<octave>4</octave>");
      expect(xml).toContain("<type>quarter</type>");
      expect(xml).toContain("<rest/>");
    });

    it("generates MusicXML with flat accidental", () => {
      const xml = generateQuarterRestPatternMusicXML("Bb3");
      expect(xml).not.toBeNull();
      expect(xml).toContain("<step>B</step>");
      expect(xml).toContain("<alter>-1</alter>");
      expect(xml).toContain("<accidental>flat</accidental>");
    });

    it("generates MusicXML with sharp accidental", () => {
      const xml = generateQuarterRestPatternMusicXML("F#4");
      expect(xml).not.toBeNull();
      expect(xml).toContain("<step>F</step>");
      expect(xml).toContain("<alter>1</alter>");
      expect(xml).toContain("<accidental>sharp</accidental>");
    });

    it("generates MusicXML with treble clef by default", () => {
      const xml = generateQuarterRestPatternMusicXML("C4");
      expect(xml).toContain("<sign>G</sign>");
      expect(xml).toContain("<line>2</line>");
    });

    it("generates MusicXML with bass clef when specified", () => {
      const xml = generateQuarterRestPatternMusicXML("C3", "bass");
      expect(xml).toContain("<sign>F</sign>");
      expect(xml).toContain("<line>4</line>");
    });

    it("returns null for invalid note", () => {
      const xml = generateQuarterRestPatternMusicXML("invalid");
      expect(xml).toBeNull();
    });

    it("generates two measures", () => {
      const xml = generateQuarterRestPatternMusicXML("C4");
      expect(xml).toContain('measure number="1"');
      expect(xml).toContain('measure number="2"');
    });
  });

  describe("analyzeQuarterRestPerformance", () => {
    const perfectPerformance = {
      totalSoundingCount: 100,
      onPitchCount: 80,
      hasHitTargetPitch: true,
      // 8 beats: odd are notes (high %), even are rests (low %)
      beatSoundPercentages: [0.9, 0.1, 0.9, 0.1, 0.9, 0.1, 0.9, 0.1],
      startedEarly: false,
    };

    it("returns success for perfect performance", () => {
      const result = analyzeQuarterRestPerformance(perfectPerformance);
      expect(result.success).toBe(true);
      expect(result.pitchOk).toBe(true);
      expect(result.rhythmOk).toBe(true);
      expect(result.message).toBe("Great!");
    });

    it("returns failure when no sound detected", () => {
      const result = analyzeQuarterRestPerformance({
        ...perfectPerformance,
        totalSoundingCount: 0,
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe("No sound detected");
    });

    it("returns failure when started early", () => {
      const result = analyzeQuarterRestPerformance({
        ...perfectPerformance,
        startedEarly: true,
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Wait for beat ONE");
    });

    it("returns failure when note beats not sustained", () => {
      const result = analyzeQuarterRestPerformance({
        ...perfectPerformance,
        // Low sound on note beats
        beatSoundPercentages: [0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Play on beats 1, 3, 5, 7");
    });

    it("returns failure when rest beats are not silent", () => {
      const result = analyzeQuarterRestPerformance({
        ...perfectPerformance,
        // High sound on rest beats
        beatSoundPercentages: [0.9, 0.8, 0.9, 0.8, 0.9, 0.8, 0.9, 0.8],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Be silent on beats 2, 4, 6, 8");
    });

    it("returns pitch feedback when only pitch is wrong", () => {
      const result = analyzeQuarterRestPerformance({
        ...perfectPerformance,
        hasHitTargetPitch: false,
        onPitchCount: 10,
      });
      expect(result.pitchOk).toBe(false);
      expect(result.rhythmOk).toBe(true);
      expect(result.message).toContain("match the pitch");
    });

    it("returns combined feedback when both pitch and rhythm wrong", () => {
      const result = analyzeQuarterRestPerformance({
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

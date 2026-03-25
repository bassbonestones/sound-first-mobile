/**
 * Tune Composer Types Tests
 *
 * Tests for the tune composer data model, including chord symbols and progressions.
 */

import {
  createChordSymbol,
  getChordsForMeasure,
  findChordAtPosition,
  getActiveChordAtPosition,
  createChordProgression,
  createDefaultProgression,
  duplicateProgression,
  getDefaultProgression,
  getProgressionById,
  isProgressionEditable,
  isProgressionDeletable,
  addChordToProgression,
  removeChordFromProgression,
  updateChordInProgression,
  PROGRESSION_PRESET_NAMES,
  createDisplaySettings,
  DEFAULT_DISPLAY_SETTINGS,
  createScore,
  getActiveProgression,
  ACCOMPANIMENT_STYLES,
  DEFAULT_ACCOMPANIMENT_STYLE,
  ACCOMPANIMENT_STYLE_LABELS,
  isValidAccompanimentStyle,
  createPlaybackSettings,
  DEFAULT_PLAYBACK_SETTINGS,
  type ChordSymbol,
  type ChordProgression,
  type ScoreDisplaySettings,
  type AccompanimentStyle,
  type PlaybackSettings,
} from "../src/features/tune-composer/types";

describe("Tune Composer Types", () => {
  describe("ChordSymbol", () => {
    describe("createChordSymbol", () => {
      it("should create a chord symbol with required fields", () => {
        const chord = createChordSymbol("Cmaj7", 0);
        expect(chord.symbol).toBe("Cmaj7");
        expect(chord.measureIndex).toBe(0);
        expect(chord.beatPosition).toBe(0);
        expect(chord.id).toBeDefined();
      });

      it("should create a chord symbol with custom beat position", () => {
        const chord = createChordSymbol("Dm7", 1, 2);
        expect(chord.symbol).toBe("Dm7");
        expect(chord.measureIndex).toBe(1);
        expect(chord.beatPosition).toBe(2);
      });

      it("should support sub-beat positions", () => {
        const chord = createChordSymbol("G7", 2, 2.5);
        expect(chord.beatPosition).toBe(2.5); // "and" of beat 3
      });

      it("should generate unique IDs", () => {
        const chord1 = createChordSymbol("C", 0);
        const chord2 = createChordSymbol("C", 0);
        expect(chord1.id).not.toBe(chord2.id);
      });

      it("should accept any chord symbol string", () => {
        // Basic triads
        expect(createChordSymbol("C", 0).symbol).toBe("C");
        expect(createChordSymbol("Cm", 0).symbol).toBe("Cm");
        expect(createChordSymbol("Cdim", 0).symbol).toBe("Cdim");
        expect(createChordSymbol("Caug", 0).symbol).toBe("Caug");

        // Seventh chords
        expect(createChordSymbol("Cmaj7", 0).symbol).toBe("Cmaj7");
        expect(createChordSymbol("Cm7", 0).symbol).toBe("Cm7");
        expect(createChordSymbol("C7", 0).symbol).toBe("C7");
        expect(createChordSymbol("Cdim7", 0).symbol).toBe("Cdim7");
        expect(createChordSymbol("Cm7b5", 0).symbol).toBe("Cm7b5");

        // Alterations
        expect(createChordSymbol("C7#9", 0).symbol).toBe("C7#9");
        expect(createChordSymbol("C7b9", 0).symbol).toBe("C7b9");
        expect(createChordSymbol("C7alt", 0).symbol).toBe("C7alt");

        // Slash chords
        expect(createChordSymbol("C/E", 0).symbol).toBe("C/E");
        expect(createChordSymbol("Dm7/G", 0).symbol).toBe("Dm7/G");
      });
    });

    describe("getChordsForMeasure", () => {
      const testChords: ChordSymbol[] = [
        { id: "1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        { id: "2", symbol: "Dm7", measureIndex: 0, beatPosition: 2 },
        { id: "3", symbol: "G7", measureIndex: 1, beatPosition: 0 },
        { id: "4", symbol: "Cmaj7", measureIndex: 1, beatPosition: 2 },
        { id: "5", symbol: "Am7", measureIndex: 2, beatPosition: 0 },
      ];

      it("should return chords for a specific measure", () => {
        const measure0Chords = getChordsForMeasure(testChords, 0);
        expect(measure0Chords).toHaveLength(2);
        expect(measure0Chords[0].symbol).toBe("Cmaj7");
        expect(measure0Chords[1].symbol).toBe("Dm7");
      });

      it("should return chords sorted by beat position", () => {
        const unsortedChords: ChordSymbol[] = [
          { id: "1", symbol: "Dm7", measureIndex: 0, beatPosition: 2 },
          { id: "2", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
          { id: "3", symbol: "G7", measureIndex: 0, beatPosition: 3.5 },
        ];
        const sorted = getChordsForMeasure(unsortedChords, 0);
        expect(sorted[0].beatPosition).toBe(0);
        expect(sorted[1].beatPosition).toBe(2);
        expect(sorted[2].beatPosition).toBe(3.5);
      });

      it("should return empty array for measure with no chords", () => {
        const result = getChordsForMeasure(testChords, 10);
        expect(result).toEqual([]);
      });

      it("should return empty array for empty chords array", () => {
        const result = getChordsForMeasure([], 0);
        expect(result).toEqual([]);
      });
    });

    describe("findChordAtPosition", () => {
      const testChords: ChordSymbol[] = [
        { id: "1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        { id: "2", symbol: "Dm7", measureIndex: 0, beatPosition: 2 },
        { id: "3", symbol: "G7", measureIndex: 1, beatPosition: 0 },
      ];

      it("should find chord at exact position", () => {
        const chord = findChordAtPosition(testChords, 0, 2);
        expect(chord).toBeDefined();
        expect(chord?.symbol).toBe("Dm7");
      });

      it("should return undefined for position with no chord", () => {
        const chord = findChordAtPosition(testChords, 0, 1);
        expect(chord).toBeUndefined();
      });

      it("should return undefined for measure with no chords", () => {
        const chord = findChordAtPosition(testChords, 5, 0);
        expect(chord).toBeUndefined();
      });

      it("should distinguish between measures", () => {
        const chordM0 = findChordAtPosition(testChords, 0, 0);
        const chordM1 = findChordAtPosition(testChords, 1, 0);
        expect(chordM0?.symbol).toBe("Cmaj7");
        expect(chordM1?.symbol).toBe("G7");
      });
    });

    describe("getActiveChordAtPosition", () => {
      const testChords: ChordSymbol[] = [
        { id: "1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        { id: "2", symbol: "Dm7", measureIndex: 0, beatPosition: 2 },
        { id: "3", symbol: "G7", measureIndex: 1, beatPosition: 0 },
        { id: "4", symbol: "Cmaj7", measureIndex: 1, beatPosition: 2 },
      ];

      it("should return chord at exact position", () => {
        const chord = getActiveChordAtPosition(testChords, 0, 0);
        expect(chord?.symbol).toBe("Cmaj7");
      });

      it("should return most recent chord before position", () => {
        const chord = getActiveChordAtPosition(testChords, 0, 3);
        expect(chord?.symbol).toBe("Dm7");
      });

      it("should return chord from previous measure if no chord in current measure before position", () => {
        // Position: measure 1, beat 0.5 (before first chord in measure 1 which is at beat 0... wait)
        // Actually G7 is at beat 0 in measure 1, so let's test with a measure that has no chords early
        const chordsWithGap: ChordSymbol[] = [
          { id: "1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
          { id: "2", symbol: "G7", measureIndex: 2, beatPosition: 0 },
        ];
        // In measure 1, there are no chords, so it should look back to measure 0
        const chord = getActiveChordAtPosition(chordsWithGap, 1, 2);
        expect(chord?.symbol).toBe("Cmaj7");
      });

      it("should return last chord of previous measure when current measure has no prior chords", () => {
        const chords: ChordSymbol[] = [
          { id: "1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
          { id: "2", symbol: "Dm7", measureIndex: 0, beatPosition: 2 },
          { id: "3", symbol: "G7", measureIndex: 2, beatPosition: 2 },
        ];
        // Measure 1 has no chords, checking beat 0 should return Dm7 from measure 0
        const chord = getActiveChordAtPosition(chords, 1, 0);
        expect(chord?.symbol).toBe("Dm7");
      });

      it("should return undefined when no chords exist before position", () => {
        const chords: ChordSymbol[] = [
          { id: "1", symbol: "Cmaj7", measureIndex: 2, beatPosition: 0 },
        ];
        const chord = getActiveChordAtPosition(chords, 0, 0);
        expect(chord).toBeUndefined();
      });

      it("should return undefined for empty chords array", () => {
        const chord = getActiveChordAtPosition([], 0, 0);
        expect(chord).toBeUndefined();
      });

      it("should handle sub-beat positions", () => {
        const chords: ChordSymbol[] = [
          { id: "1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
          { id: "2", symbol: "Dm7", measureIndex: 0, beatPosition: 2.5 },
        ];
        // Position 2.25 is before Dm7 (at 2.5), so should return Cmaj7
        expect(getActiveChordAtPosition(chords, 0, 2.25)?.symbol).toBe("Cmaj7");
        // Position 2.5 should return Dm7
        expect(getActiveChordAtPosition(chords, 0, 2.5)?.symbol).toBe("Dm7");
        // Position 3 is after Dm7, so should return Dm7
        expect(getActiveChordAtPosition(chords, 0, 3)?.symbol).toBe("Dm7");
      });
    });
  });

  describe("ChordProgression", () => {
    describe("PROGRESSION_PRESET_NAMES", () => {
      it("should contain expected preset names", () => {
        expect(PROGRESSION_PRESET_NAMES).toContain("Default");
        expect(PROGRESSION_PRESET_NAMES).toContain("Reharmonization");
        expect(PROGRESSION_PRESET_NAMES).toContain("Simplified");
        expect(PROGRESSION_PRESET_NAMES).toContain("Modal");
        expect(PROGRESSION_PRESET_NAMES).toContain("Blues Changes");
        expect(PROGRESSION_PRESET_NAMES).toContain("Bird Changes");
      });

      it("should be a readonly array", () => {
        expect(Array.isArray(PROGRESSION_PRESET_NAMES)).toBe(true);
        expect(PROGRESSION_PRESET_NAMES.length).toBeGreaterThan(0);
      });
    });

    describe("createChordProgression", () => {
      it("should create a progression with provided values", () => {
        const progression = createChordProgression("My Progression", {
          isDefault: false,
          isAutoInferred: false,
          isSystemDefined: false,
        });

        expect(progression.id).toBeDefined();
        expect(progression.name).toBe("My Progression");
        expect(progression.chords).toEqual([]);
        expect(progression.isDefault).toBe(false);
        expect(progression.isAutoInferred).toBe(false);
        expect(progression.isSystemDefined).toBe(false);
      });

      it("should create a system-defined progression", () => {
        const progression = createChordProgression("System Prog", {
          isDefault: true,
          isAutoInferred: true,
          isSystemDefined: true,
        });

        expect(progression.isDefault).toBe(true);
        expect(progression.isAutoInferred).toBe(true);
        expect(progression.isSystemDefined).toBe(true);
      });

      it("should generate unique IDs", () => {
        const p1 = createChordProgression("Prog 1");
        const p2 = createChordProgression("Prog 2");
        expect(p1.id).not.toBe(p2.id);
      });

      it("should default flags to false when options not provided", () => {
        const progression = createChordProgression("Simple");
        expect(progression.isDefault).toBe(false);
        expect(progression.isAutoInferred).toBeUndefined();
        expect(progression.isSystemDefined).toBeUndefined();
      });
    });

    describe("createDefaultProgression", () => {
      it("should create a default progression with standard flags", () => {
        const progression = createDefaultProgression();

        expect(progression.name).toBe("Default");
        expect(progression.chords).toEqual([]);
        expect(progression.isDefault).toBe(true);
      });

      it("should create empty default progression", () => {
        const progression = createDefaultProgression();
        expect(progression.chords).toEqual([]);
        expect(progression.isDefault).toBe(true);
      });
    });

    describe("duplicateProgression", () => {
      it("should create a copy with a new name", () => {
        const original = createChordProgression("Original", {
          isDefault: true,
          isSystemDefined: true,
        });
        const originalWithChords: ChordProgression = {
          ...original,
          chords: [
            { id: "c1", symbol: "G7", measureIndex: 0, beatPosition: 0 },
          ],
        };
        const duplicate = duplicateProgression(
          originalWithChords,
          "Copy of Original",
        );

        expect(duplicate.id).not.toBe(originalWithChords.id);
        expect(duplicate.name).toBe("Copy of Original");
        expect(duplicate.chords).toHaveLength(1);
        expect(duplicate.chords[0].symbol).toBe("G7");
      });

      it("should always make duplicate user-editable", () => {
        const systemProg = createChordProgression("System", {
          isDefault: true,
          isAutoInferred: true,
          isSystemDefined: true,
        });
        const duplicate = duplicateProgression(systemProg, "User Copy");

        expect(duplicate.isDefault).toBe(false);
        expect(duplicate.isAutoInferred).toBe(false);
        expect(duplicate.isSystemDefined).toBe(false);
      });

      it("should create new IDs for duplicated chords", () => {
        const original = createChordProgression("Original");
        const originalWithChords: ChordProgression = {
          ...original,
          chords: [
            { id: "old-id", symbol: "Am7", measureIndex: 0, beatPosition: 0 },
          ],
        };
        const duplicate = duplicateProgression(originalWithChords, "Duplicate");

        expect(duplicate.chords[0].id).not.toBe("old-id");
        expect(duplicate.chords[0].symbol).toBe("Am7");
      });

      it("should use default copy name when not provided", () => {
        const original = createChordProgression("My Prog");
        const duplicate = duplicateProgression(original);

        expect(duplicate.name).toBe("My Prog (Copy)");
      });
    });

    describe("getDefaultProgression", () => {
      it("should return the default progression from a list", () => {
        const progressions: ChordProgression[] = [
          createChordProgression("Custom"),
          createDefaultProgression(),
          createChordProgression("Another"),
        ];

        const defaultProg = getDefaultProgression(progressions);
        expect(defaultProg?.name).toBe("Default");
        expect(defaultProg?.isDefault).toBe(true);
      });

      it("should return undefined when no default exists", () => {
        const progressions: ChordProgression[] = [
          createChordProgression("Custom"),
        ];

        expect(getDefaultProgression(progressions)).toBeUndefined();
      });

      it("should return undefined for empty array", () => {
        expect(getDefaultProgression([])).toBeUndefined();
      });
    });

    describe("getProgressionById", () => {
      it("should find progression by ID", () => {
        const target = createChordProgression("Target");
        const progressions = [
          createChordProgression("Other"),
          target,
          createChordProgression("Another"),
        ];

        const found = getProgressionById(progressions, target.id);
        expect(found).toBe(target);
      });

      it("should return undefined for non-existent ID", () => {
        const progressions = [createChordProgression("Only")];

        expect(
          getProgressionById(progressions, "non-existent"),
        ).toBeUndefined();
      });
    });

    describe("isProgressionEditable", () => {
      it("should return false for system-defined progression", () => {
        const systemProg = createChordProgression("System", {
          isSystemDefined: true,
        });
        expect(isProgressionEditable(systemProg)).toBe(false);
      });

      it("should return true for user-created progression", () => {
        const userProg = createChordProgression("User Created");
        expect(isProgressionEditable(userProg)).toBe(true);
      });

      it("should return true when isSystemDefined is undefined", () => {
        const prog = createChordProgression("Prog");
        expect(isProgressionEditable(prog)).toBe(true);
      });
    });

    describe("isProgressionDeletable", () => {
      it("should return false for system-defined progression", () => {
        const systemProg = createChordProgression("System", {
          isSystemDefined: true,
        });
        expect(isProgressionDeletable(systemProg)).toBe(false);
      });

      it("should return true for user-created non-default progression", () => {
        const userProg = createChordProgression("User Created");
        expect(isProgressionDeletable(userProg)).toBe(true);
      });

      it("should return true when isSystemDefined is undefined", () => {
        const prog = createChordProgression("Prog");
        expect(isProgressionDeletable(prog)).toBe(true);
      });
    });

    describe("addChordToProgression", () => {
      it("should add a chord to the progression", () => {
        const progression = createChordProgression("Test");
        const newChord: ChordSymbol = {
          id: "new",
          symbol: "Fmaj7",
          measureIndex: 0,
          beatPosition: 0,
        };

        const updated = addChordToProgression(progression, newChord);

        expect(updated.chords).toHaveLength(1);
        expect(updated.chords[0]).toEqual(newChord);
        expect(updated.id).toBe(progression.id);
      });

      it("should preserve existing chords and sort by position", () => {
        const existingChord: ChordSymbol = {
          id: "existing",
          symbol: "Cmaj7",
          measureIndex: 0,
          beatPosition: 0,
        };
        const progWithChord: ChordProgression = {
          ...createChordProgression("Test"),
          chords: [existingChord],
        };
        const newChord: ChordSymbol = {
          id: "new",
          symbol: "G7",
          measureIndex: 1,
          beatPosition: 0,
        };

        const updated = addChordToProgression(progWithChord, newChord);

        expect(updated.chords).toHaveLength(2);
        expect(updated.chords[0]).toEqual(existingChord);
        expect(updated.chords[1]).toEqual(newChord);
      });

      it("should replace chord at same position", () => {
        const existingChord: ChordSymbol = {
          id: "existing",
          symbol: "Cmaj7",
          measureIndex: 0,
          beatPosition: 0,
        };
        const progWithChord: ChordProgression = {
          ...createChordProgression("Test"),
          chords: [existingChord],
        };
        const newChord: ChordSymbol = {
          id: "new",
          symbol: "C7",
          measureIndex: 0,
          beatPosition: 0,
        };

        const updated = addChordToProgression(progWithChord, newChord);

        expect(updated.chords).toHaveLength(1);
        expect(updated.chords[0].symbol).toBe("C7");
      });

      it("should not mutate original progression", () => {
        const progression = createChordProgression("Test");
        const newChord: ChordSymbol = {
          id: "new",
          symbol: "Am7",
          measureIndex: 0,
          beatPosition: 0,
        };

        addChordToProgression(progression, newChord);

        expect(progression.chords).toHaveLength(0);
      });
    });

    describe("removeChordFromProgression", () => {
      it("should remove chord by ID", () => {
        const chords: ChordSymbol[] = [
          { id: "keep1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
          { id: "remove", symbol: "Dm7", measureIndex: 0, beatPosition: 2 },
          { id: "keep2", symbol: "G7", measureIndex: 1, beatPosition: 0 },
        ];
        const progression: ChordProgression = {
          ...createChordProgression("Test"),
          chords,
        };

        const updated = removeChordFromProgression(progression, "remove");

        expect(updated.chords).toHaveLength(2);
        expect(updated.chords.map((c) => c.id)).toEqual(["keep1", "keep2"]);
      });

      it("should return unchanged progression if chord not found", () => {
        const chords: ChordSymbol[] = [
          { id: "c1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        ];
        const progression: ChordProgression = {
          ...createChordProgression("Test"),
          chords,
        };

        const updated = removeChordFromProgression(progression, "non-existent");

        expect(updated.chords).toHaveLength(1);
      });

      it("should not mutate original progression", () => {
        const chords: ChordSymbol[] = [
          { id: "c1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        ];
        const progression: ChordProgression = {
          ...createChordProgression("Test"),
          chords,
        };

        removeChordFromProgression(progression, "c1");

        expect(progression.chords).toHaveLength(1);
      });
    });

    describe("updateChordInProgression", () => {
      it("should update chord symbol", () => {
        const chords: ChordSymbol[] = [
          { id: "c1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
          { id: "c2", symbol: "Dm7", measureIndex: 0, beatPosition: 2 },
        ];
        const progression: ChordProgression = {
          ...createChordProgression("Test"),
          chords,
        };

        const updated = updateChordInProgression(progression, "c1", {
          symbol: "C7",
        });

        expect(updated.chords[0].symbol).toBe("C7");
        expect(updated.chords[1].symbol).toBe("Dm7");
      });

      it("should update beat position of chord", () => {
        const chords: ChordSymbol[] = [
          { id: "c1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        ];
        const progression: ChordProgression = {
          ...createChordProgression("Test"),
          chords,
        };

        const updated = updateChordInProgression(progression, "c1", {
          measureIndex: 1,
          beatPosition: 2,
        });

        expect(updated.chords[0].measureIndex).toBe(1);
        expect(updated.chords[0].beatPosition).toBe(2);
      });

      it("should not mutate original progression", () => {
        const chords: ChordSymbol[] = [
          { id: "c1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        ];
        const progression: ChordProgression = {
          ...createChordProgression("Test"),
          chords,
        };

        updateChordInProgression(progression, "c1", { symbol: "C7" });

        expect(progression.chords[0].symbol).toBe("Cmaj7");
      });

      it("should return unchanged progression if chord ID not found", () => {
        const chords: ChordSymbol[] = [
          { id: "c1", symbol: "Cmaj7", measureIndex: 0, beatPosition: 0 },
        ];
        const progression: ChordProgression = {
          ...createChordProgression("Test"),
          chords,
        };

        const updated = updateChordInProgression(progression, "non-existent", {
          symbol: "G7",
        });

        expect(updated.chords).toHaveLength(1);
        expect(updated.chords[0].symbol).toBe("Cmaj7");
      });
    });
  });

  describe("ScoreDisplaySettings", () => {
    describe("DEFAULT_DISPLAY_SETTINGS", () => {
      it("should have showChordSymbols enabled by default", () => {
        expect(DEFAULT_DISPLAY_SETTINGS.showChordSymbols).toBe(true);
      });

      it("should not have activeProgressionId set", () => {
        expect(DEFAULT_DISPLAY_SETTINGS.activeProgressionId).toBeUndefined();
      });
    });

    describe("createDisplaySettings", () => {
      it("should create default settings when no options provided", () => {
        const settings = createDisplaySettings();
        expect(settings.showChordSymbols).toBe(true);
        expect(settings.activeProgressionId).toBeUndefined();
      });

      it("should allow overriding showChordSymbols", () => {
        const settings = createDisplaySettings({ showChordSymbols: false });
        expect(settings.showChordSymbols).toBe(false);
      });

      it("should allow setting activeProgressionId", () => {
        const settings = createDisplaySettings({
          activeProgressionId: "prog-123",
        });
        expect(settings.activeProgressionId).toBe("prog-123");
      });

      it("should merge multiple options", () => {
        const settings = createDisplaySettings({
          showChordSymbols: false,
          activeProgressionId: "custom",
        });
        expect(settings.showChordSymbols).toBe(false);
        expect(settings.activeProgressionId).toBe("custom");
      });
    });
  });

  describe("TuneComposerScore", () => {
    describe("createScore", () => {
      it("should create a score with default values", () => {
        const score = createScore();

        expect(score.id).toBeDefined();
        expect(score.title).toBe("Untitled Tune");
        expect(score.clef).toBe("treble");
        expect(score.keySignature).toBe(0);
        expect(score.timeSignature).toEqual({ beats: 4, beatUnit: 4 });
        expect(score.tempo).toBe(120);
        expect(score.measures).toHaveLength(1);
      });

      it("should include default chord progression", () => {
        const score = createScore();

        expect(score.chordProgressions).toHaveLength(1);
        expect(score.chordProgressions[0].isDefault).toBe(true);
        expect(score.chordProgressions[0].name).toBe("Default");
      });

      it("should include display settings with defaults", () => {
        const score = createScore();

        expect(score.displaySettings).toBeDefined();
        expect(score.displaySettings.showChordSymbols).toBe(true);
        expect(score.displaySettings.activeProgressionId).toBeUndefined();
      });

      it("should allow overriding display settings", () => {
        const score = createScore({
          displaySettings: {
            showChordSymbols: false,
            activeProgressionId: "custom-id",
          },
        });

        expect(score.displaySettings.showChordSymbols).toBe(false);
        expect(score.displaySettings.activeProgressionId).toBe("custom-id");
      });

      it("should set timestamps", () => {
        const before = new Date().toISOString();
        const score = createScore();
        const after = new Date().toISOString();

        expect(score.createdAt >= before).toBe(true);
        expect(score.createdAt <= after).toBe(true);
        expect(score.updatedAt).toBe(score.createdAt);
      });

      it("should generate unique IDs", () => {
        const score1 = createScore();
        const score2 = createScore();
        expect(score1.id).not.toBe(score2.id);
      });
    });

    describe("getActiveProgression", () => {
      it("should return default progression when no activeProgressionId set", () => {
        const score = createScore();
        const active = getActiveProgression(score);

        expect(active).toBeDefined();
        expect(active?.isDefault).toBe(true);
      });

      it("should return progression matching activeProgressionId", () => {
        const customProg = createChordProgression("Custom");
        const score = createScore({
          chordProgressions: [createDefaultProgression(), customProg],
          displaySettings: {
            showChordSymbols: true,
            activeProgressionId: customProg.id,
          },
        });

        const active = getActiveProgression(score);
        expect(active?.id).toBe(customProg.id);
        expect(active?.name).toBe("Custom");
      });

      it("should fall back to default if activeProgressionId not found", () => {
        const score = createScore({
          displaySettings: {
            showChordSymbols: true,
            activeProgressionId: "non-existent-id",
          },
        });

        const active = getActiveProgression(score);
        expect(active?.isDefault).toBe(true);
      });

      it("should return undefined if no progressions exist", () => {
        const score = createScore();
        score.chordProgressions = [];

        const active = getActiveProgression(score);
        expect(active).toBeUndefined();
      });
    });
  });

  describe("AccompanimentStyle", () => {
    describe("ACCOMPANIMENT_STYLES", () => {
      it("should contain all expected styles", () => {
        expect(ACCOMPANIMENT_STYLES).toContain("jazz-swing");
        expect(ACCOMPANIMENT_STYLES).toContain("bossa-nova");
        expect(ACCOMPANIMENT_STYLES).toContain("latin");
        expect(ACCOMPANIMENT_STYLES).toContain("pop-rock");
        expect(ACCOMPANIMENT_STYLES).toContain("ballad");
        expect(ACCOMPANIMENT_STYLES).toContain("funk");
        expect(ACCOMPANIMENT_STYLES).toContain("none");
      });

      it("should have 7 styles", () => {
        expect(ACCOMPANIMENT_STYLES).toHaveLength(7);
      });
    });

    describe("DEFAULT_ACCOMPANIMENT_STYLE", () => {
      it("should default to none", () => {
        expect(DEFAULT_ACCOMPANIMENT_STYLE).toBe("none");
      });
    });

    describe("ACCOMPANIMENT_STYLE_LABELS", () => {
      it("should have a label for each style", () => {
        for (const style of ACCOMPANIMENT_STYLES) {
          expect(ACCOMPANIMENT_STYLE_LABELS[style]).toBeDefined();
          expect(typeof ACCOMPANIMENT_STYLE_LABELS[style]).toBe("string");
        }
      });

      it("should have human-readable labels", () => {
        expect(ACCOMPANIMENT_STYLE_LABELS["jazz-swing"]).toBe("Jazz Swing");
        expect(ACCOMPANIMENT_STYLE_LABELS["bossa-nova"]).toBe("Bossa Nova");
        expect(ACCOMPANIMENT_STYLE_LABELS["pop-rock"]).toBe("Pop/Rock");
        expect(ACCOMPANIMENT_STYLE_LABELS["none"]).toBe("None");
      });
    });

    describe("isValidAccompanimentStyle", () => {
      it("should return true for valid styles", () => {
        expect(isValidAccompanimentStyle("jazz-swing")).toBe(true);
        expect(isValidAccompanimentStyle("bossa-nova")).toBe(true);
        expect(isValidAccompanimentStyle("none")).toBe(true);
      });

      it("should return false for invalid styles", () => {
        expect(isValidAccompanimentStyle("invalid")).toBe(false);
        expect(isValidAccompanimentStyle("")).toBe(false);
        expect(isValidAccompanimentStyle("Jazz Swing")).toBe(false);
      });

      it("should work as type guard", () => {
        const value: string = "jazz-swing";
        if (isValidAccompanimentStyle(value)) {
          // TypeScript should recognize value as AccompanimentStyle here
          const style: AccompanimentStyle = value;
          expect(style).toBe("jazz-swing");
        }
      });
    });
  });

  describe("PlaybackSettings", () => {
    describe("DEFAULT_PLAYBACK_SETTINGS", () => {
      it("should have accompanimentStyle set to none", () => {
        expect(DEFAULT_PLAYBACK_SETTINGS.accompanimentStyle).toBe("none");
      });
    });

    describe("createPlaybackSettings", () => {
      it("should create default settings when no options provided", () => {
        const settings = createPlaybackSettings();
        expect(settings.accompanimentStyle).toBe("none");
      });

      it("should allow overriding accompanimentStyle", () => {
        const settings = createPlaybackSettings({
          accompanimentStyle: "jazz-swing",
        });
        expect(settings.accompanimentStyle).toBe("jazz-swing");
      });

      it("should accept any valid accompaniment style", () => {
        const styles: AccompanimentStyle[] = [
          "jazz-swing",
          "bossa-nova",
          "latin",
          "pop-rock",
          "ballad",
          "funk",
          "none",
        ];

        for (const style of styles) {
          const settings = createPlaybackSettings({
            accompanimentStyle: style,
          });
          expect(settings.accompanimentStyle).toBe(style);
        }
      });
    });

    describe("TuneComposerScore playbackSettings integration", () => {
      it("should include playbackSettings with defaults", () => {
        const score = createScore();

        expect(score.playbackSettings).toBeDefined();
        expect(score.playbackSettings.accompanimentStyle).toBe("none");
      });

      it("should allow overriding playbackSettings", () => {
        const score = createScore({
          playbackSettings: {
            accompanimentStyle: "bossa-nova",
          },
        });

        expect(score.playbackSettings.accompanimentStyle).toBe("bossa-nova");
      });
    });
  });
});

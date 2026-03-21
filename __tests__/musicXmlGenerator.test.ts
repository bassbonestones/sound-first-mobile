/**
 * MusicXML Generator Tests
 *
 * Tests for converting ComposerScore to MusicXML format.
 */

import {
  generateMusicXml,
  generateMusicXmlPreview,
  validateScoreForExport,
} from "../src/features/composer/services/musicXmlGenerator";
import {
  createScore,
  createMeasure,
  createNote,
  createRest,
  DURATION,
} from "../src/features/composer/types";
import type {
  ComposerScore,
  Measure,
  Note,
} from "../src/features/composer/types";

describe("MusicXML Generator", () => {
  describe("generateMusicXml", () => {
    it("should generate valid MusicXML header", () => {
      const score = createScore();
      const xml = generateMusicXml(score);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<!DOCTYPE score-partwise");
      expect(xml).toContain('<score-partwise version="3.1">');
    });

    it("should include work title", () => {
      const score = createScore({ title: "My Test Score" });
      const xml = generateMusicXml(score);

      expect(xml).toContain("<work-title>My Test Score</work-title>");
    });

    it("should escape XML special characters in title", () => {
      const score = createScore({ title: "Test & <Score>" });
      const xml = generateMusicXml(score);

      expect(xml).toContain(
        "<work-title>Test &amp; &lt;Score&gt;</work-title>",
      );
    });

    it("should include identification with software name", () => {
      const score = createScore();
      const xml = generateMusicXml(score);

      expect(xml).toContain(
        "<software>Sound First Practice Composer</software>",
      );
    });

    it("should generate part list", () => {
      const score = createScore();
      const xml = generateMusicXml(score);

      expect(xml).toContain("<part-list>");
      expect(xml).toContain('<score-part id="P1">');
      expect(xml).toContain("<part-name>Part 1</part-name>");
    });

    it("should generate measure with attributes", () => {
      const score = createScore({
        timeSignature: { beats: 3, beatUnit: 4 },
        keySignature: 2, // D major
        clef: "treble",
      });
      const xml = generateMusicXml(score);

      expect(xml).toContain('<measure number="1">');
      expect(xml).toContain("<divisions>12</divisions>");
      expect(xml).toContain("<fifths>2</fifths>");
      expect(xml).toContain("<beats>3</beats>");
      expect(xml).toContain("<beat-type>4</beat-type>");
      expect(xml).toContain("<sign>G</sign>");
      expect(xml).toContain("<line>2</line>");
    });

    it("should generate bass clef correctly", () => {
      const score = createScore({ clef: "bass" });
      const xml = generateMusicXml(score);

      expect(xml).toContain("<sign>F</sign>");
      expect(xml).toContain("<line>4</line>");
    });

    it("should generate tempo direction when score has notes", () => {
      const measure = createMeasure();
      measure.notes = [createNote(60, DURATION.QUARTER)];
      const score = createScore({ tempo: 80, measures: [measure] });
      const xml = generateMusicXml(score);

      expect(xml).toContain("<per-minute>80</per-minute>");
      expect(xml).toContain('<sound tempo="80"/>');
    });

    it("should include tempo direction even for rest-only measures", () => {
      // With pre-filled measures, new scores have rests, not empty measures
      // Tempo should still be included
      const score = createScore({ tempo: 120 });
      const xml = generateMusicXml(score);

      expect(xml).toContain("<per-minute>120</per-minute>");
      expect(xml).toContain('<sound tempo="120"/>');
    });
  });

  describe("Note generation", () => {
    function createScoreWithNotes(notes: Note[]): ComposerScore {
      const measure = createMeasure();
      measure.notes = notes;
      return createScore({ measures: [measure] });
    }

    it("should generate quarter note", () => {
      const note = createNote(60, DURATION.QUARTER); // C4
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<step>C</step>");
      expect(xml).toContain("<octave>4</octave>");
      expect(xml).toContain("<duration>12</duration>");
      expect(xml).toContain("<type>quarter</type>");
    });

    it("should generate whole note", () => {
      const note = createNote(60, DURATION.WHOLE);
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<duration>48</duration>");
      expect(xml).toContain("<type>whole</type>");
    });

    it("should generate half note", () => {
      const note = createNote(60, DURATION.HALF);
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<duration>24</duration>");
      expect(xml).toContain("<type>half</type>");
    });

    it("should generate eighth note", () => {
      const note = createNote(60, DURATION.EIGHTH);
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<duration>6</duration>");
      expect(xml).toContain("<type>eighth</type>");
    });

    it("should generate sixteenth note", () => {
      const note = createNote(60, DURATION.SIXTEENTH);
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<duration>3</duration>");
      expect(xml).toContain("<type>16th</type>");
    });

    it("should generate rest", () => {
      const rest = createRest(DURATION.QUARTER);
      const score = createScoreWithNotes([rest]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<rest/>");
      expect(xml).toContain("<duration>12</duration>");
      expect(xml).toContain("<type>quarter</type>");
      expect(xml).not.toContain("<pitch>");
    });

    it("should generate sharp accidental", () => {
      const note = createNote(61, DURATION.QUARTER, { accidental: "sharp" }); // C#4
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<alter>1</alter>");
      expect(xml).toContain("<accidental>sharp</accidental>");
    });

    it("should generate flat accidental", () => {
      const note = createNote(58, DURATION.QUARTER, { accidental: "flat" }); // Bb3
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<alter>-1</alter>");
      expect(xml).toContain("<accidental>flat</accidental>");
    });

    it("should generate natural accidental", () => {
      const note = createNote(60, DURATION.QUARTER, { accidental: "natural" });
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<accidental>natural</accidental>");
    });

    it("should generate tie start", () => {
      const note = createNote(60, DURATION.QUARTER, { tieStart: true });
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain('<tie type="start"/>');
      expect(xml).toContain('<tied type="start"/>');
    });

    it("should generate tie end", () => {
      const note = createNote(60, DURATION.QUARTER, { tieEnd: true });
      const score = createScoreWithNotes([note]);
      const xml = generateMusicXml(score);

      expect(xml).toContain('<tie type="stop"/>');
      expect(xml).toContain('<tied type="stop"/>');
    });

    it("should handle different octaves", () => {
      // MIDI 48 = C3, 60 = C4, 72 = C5
      const notes = [
        createNote(48, DURATION.QUARTER),
        createNote(60, DURATION.QUARTER),
        createNote(72, DURATION.QUARTER),
      ];
      const score = createScoreWithNotes(notes);
      const xml = generateMusicXml(score);

      expect(xml).toContain("<octave>3</octave>");
      expect(xml).toContain("<octave>4</octave>");
      expect(xml).toContain("<octave>5</octave>");
    });

    it("should convert all pitch classes", () => {
      // Test C, D, E, F, G, A, B
      const midiNotes = [60, 62, 64, 65, 67, 69, 71]; // C4 to B4
      const expectedSteps = ["C", "D", "E", "F", "G", "A", "B"];

      midiNotes.forEach((midi, i) => {
        const note = createNote(midi, DURATION.QUARTER);
        const score = createScoreWithNotes([note]);
        const xml = generateMusicXml(score);
        expect(xml).toContain(`<step>${expectedSteps[i]}</step>`);
      });
    });
  });

  describe("Multi-measure scores", () => {
    it("should generate multiple measures", () => {
      const score = createScore();
      score.measures = [createMeasure(), createMeasure(), createMeasure()];
      const xml = generateMusicXml(score);

      expect(xml).toContain('<measure number="1">');
      expect(xml).toContain('<measure number="2">');
      expect(xml).toContain('<measure number="3">');
    });

    it("should only include attributes in first measure", () => {
      const score = createScore();
      score.measures = [createMeasure(), createMeasure()];
      const xml = generateMusicXml(score);

      // Count occurrences of <divisions>
      const divisionsCount = (xml.match(/<divisions>/g) || []).length;
      expect(divisionsCount).toBe(1);

      // Count occurrences of <clef>
      const clefCount = (xml.match(/<clef>/g) || []).length;
      expect(clefCount).toBe(1);
    });
  });

  describe("Selected note highlighting", () => {
    it("should add color attribute to selected note", () => {
      const note = createNote(60, DURATION.QUARTER);
      const measure = createMeasure();
      measure.notes = [note];
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score, { selectedNoteId: note.id });

      expect(xml).toContain('color="#0066CC"');
    });

    it("should not add color to unselected notes", () => {
      const note1 = createNote(60, DURATION.QUARTER);
      const note2 = createNote(62, DURATION.QUARTER);
      const measure = createMeasure();
      measure.notes = [note1, note2];
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score, { selectedNoteId: note1.id });

      // Count color attributes
      const colorCount = (xml.match(/color="#0066CC"/g) || []).length;
      expect(colorCount).toBe(1);
    });
  });

  describe("Key signature handling", () => {
    it("should prefer flats for flat key signatures", () => {
      // In a flat key, Bb (MIDI 70) should be notated as Bb, not A#
      const note = createNote(70, DURATION.QUARTER);
      const measure = createMeasure();
      measure.notes = [note];
      const score = createScore({
        keySignature: -2, // Bb major
        measures: [measure],
      });

      const xml = generateMusicXml(score);
      expect(xml).toContain("<fifths>-2</fifths>");
    });

    it("should prefer sharps for sharp key signatures", () => {
      const score = createScore({
        keySignature: 3, // A major
      });

      const xml = generateMusicXml(score);
      expect(xml).toContain("<fifths>3</fifths>");
    });
  });

  describe("Options", () => {
    it("should include header by default", () => {
      const score = createScore();
      const xml = generateMusicXml(score);

      expect(xml).toContain("<?xml version");
      expect(xml).toContain("<!DOCTYPE");
    });

    it("should include header when explicitly requested", () => {
      const score = createScore();
      const xml = generateMusicXml(score, { includeHeader: true });

      expect(xml).toContain("<?xml version");
    });
  });

  describe("validateScoreForExport", () => {
    it("should validate valid score", () => {
      const score = createScore();
      const result = validateScoreForExport(score);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject score with no measures", () => {
      const score = createScore();
      score.measures = [];
      const result = validateScoreForExport(score);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Score must have at least one measure");
    });

    it("should reject tempo too low", () => {
      const score = createScore({ tempo: 10 });
      const result = validateScoreForExport(score);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tempo must be between 20 and 400 BPM");
    });

    it("should reject tempo too high", () => {
      const score = createScore({ tempo: 500 });
      const result = validateScoreForExport(score);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tempo must be between 20 and 400 BPM");
    });

    it("should reject invalid MIDI values", () => {
      const note = createNote(-1, DURATION.QUARTER);
      const measure = createMeasure();
      measure.notes = [note];
      const score = createScore({ measures: [measure] });

      const result = validateScoreForExport(score);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Invalid MIDI value");
    });

    it("should accept rest notes (midi = null)", () => {
      const rest = createRest(DURATION.QUARTER);
      const measure = createMeasure();
      measure.notes = [rest];
      const score = createScore({ measures: [measure] });

      const result = validateScoreForExport(score);

      expect(result.valid).toBe(true);
    });
  });

  describe("generateMusicXmlPreview", () => {
    it("should generate MusicXML with header", () => {
      const score = createScore();
      const xml = generateMusicXmlPreview(score);

      expect(xml).toContain("<?xml version");
      expect(xml).toContain("<score-partwise");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty measure", () => {
      const score = createScore();
      const xml = generateMusicXml(score);

      // Should still generate valid XML
      expect(xml).toContain('<measure number="1">');
      expect(xml).toContain("</measure>");
    });

    it("should handle measure with many notes", () => {
      const notes = Array.from({ length: 16 }, () =>
        createNote(60, DURATION.SIXTEENTH),
      );
      const measure = createMeasure();
      measure.notes = notes;
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score);

      // Should have 16 notes
      const noteCount = (xml.match(/<note>/g) || []).length;
      expect(noteCount).toBe(16);
    });

    it("should handle extreme MIDI values", () => {
      const lowNote = createNote(0, DURATION.QUARTER); // Lowest possible
      const highNote = createNote(127, DURATION.QUARTER); // Highest possible
      const measure = createMeasure();
      measure.notes = [lowNote, highNote];
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score);

      expect(xml).toContain("<octave>-1</octave>"); // MIDI 0 = C-1
      expect(xml).toContain("<octave>9</octave>"); // MIDI 127 = G9
    });
  });

  describe("Triplet beaming", () => {
    it("should beam three consecutive triplet eighths", () => {
      const groupId = "triplet-1";
      const notes = [
        createNote(60, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: groupId,
          tripletPosition: 1,
        }),
        createNote(62, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: groupId,
          tripletPosition: 2,
        }),
        createNote(64, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: groupId,
          tripletPosition: 3,
        }),
      ];
      const measure = createMeasure();
      measure.notes = notes;
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score);

      expect(xml).toContain('<beam number="1">begin</beam>');
      expect(xml).toContain('<beam number="1">continue</beam>');
      expect(xml).toContain('<beam number="1">end</beam>');
    });

    it("should beam two consecutive triplet eighths", () => {
      const groupId = "triplet-1";
      const notes = [
        createNote(60, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: groupId,
          tripletPosition: 1,
        }),
        createNote(62, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: groupId,
          tripletPosition: 2,
        }),
        createRest(DURATION.TRIPLET_EIGHTH), // Rest at position 3
      ];
      const measure = createMeasure();
      measure.notes = notes;
      // Rest needs triplet info too
      measure.notes[2].tripletGroupId = groupId;
      measure.notes[2].tripletPosition = 3;
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score);

      expect(xml).toContain('<beam number="1">begin</beam>');
      expect(xml).toContain('<beam number="1">end</beam>');
      // Should NOT have continue (only 2 notes)
      expect(xml).not.toContain('<beam number="1">continue</beam>');
    });

    it("should not beam triplet quarter notes", () => {
      const groupId = "triplet-1";
      const notes = [
        createNote(60, DURATION.TRIPLET_QUARTER, {
          tripletGroupId: groupId,
          tripletPosition: 1,
        }),
        createNote(62, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: groupId,
          tripletPosition: 3,
        }),
      ];
      const measure = createMeasure();
      measure.notes = notes;
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score);

      // Single eighth shouldn't be beamed
      expect(xml).not.toContain('<beam number="1">');
    });

    it("should not beam a single triplet eighth", () => {
      const groupId = "triplet-1";
      const notes = [
        createNote(60, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: groupId,
          tripletPosition: 1,
        }),
        createRest(DURATION.TRIPLET_EIGHTH),
        createRest(DURATION.TRIPLET_EIGHTH),
      ];
      // Add triplet info to rests
      notes[1].tripletGroupId = groupId;
      notes[1].tripletPosition = 2;
      notes[2].tripletGroupId = groupId;
      notes[2].tripletPosition = 3;
      const measure = createMeasure();
      measure.notes = notes;
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score);

      // Single eighth shouldn't be beamed
      expect(xml).not.toContain('<beam number="1">');
    });

    it("should not beam triplet eighths in different groups", () => {
      const group1 = "triplet-1";
      const group2 = "triplet-2";
      const notes = [
        createNote(60, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: group1,
          tripletPosition: 1,
        }),
        createNote(62, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: group1,
          tripletPosition: 2,
        }),
        createNote(64, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: group1,
          tripletPosition: 3,
        }),
        createNote(65, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: group2,
          tripletPosition: 1,
        }),
        createNote(67, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: group2,
          tripletPosition: 2,
        }),
        createNote(69, DURATION.TRIPLET_EIGHTH, {
          tripletGroupId: group2,
          tripletPosition: 3,
        }),
      ];
      const measure = createMeasure();
      measure.notes = notes;
      const score = createScore({ measures: [measure] });

      const xml = generateMusicXml(score);

      // Should have two separate beam groups (2 begins, 2 ends)
      const beginCount = (xml.match(/<beam number="1">begin<\/beam>/g) || [])
        .length;
      const endCount = (xml.match(/<beam number="1">end<\/beam>/g) || [])
        .length;
      expect(beginCount).toBe(2);
      expect(endCount).toBe(2);
    });
  });
});

/**
 * Tests for FirstNote instruments data module
 * Covers INSTRUMENT_CLEFS, BASS_CLEF_INSTRUMENTS, and getClefForInstrument
 */
import {
  INSTRUMENT_CLEFS,
  BASS_CLEF_INSTRUMENTS,
  getClefForInstrument,
} from "../../src/screens/FirstNote/data/instruments";

describe("FirstNote instruments data", () => {
  // ===========================================================================
  // INSTRUMENT_CLEFS Tests
  // ===========================================================================
  describe("INSTRUMENT_CLEFS", () => {
    it("has piano mapped to both clefs", () => {
      expect(INSTRUMENT_CLEFS.piano).toBe("both");
    });

    it("has trumpet mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS.trumpet).toBe("treble");
    });

    it("has trombone mapped to bass clef", () => {
      expect(INSTRUMENT_CLEFS.trombone).toBe("bass");
    });

    it("has bass trombone mapped to bass clef", () => {
      expect(INSTRUMENT_CLEFS["bass trombone"]).toBe("bass");
    });

    it("has tenor trombone mapped to bass clef", () => {
      expect(INSTRUMENT_CLEFS["tenor trombone"]).toBe("bass");
    });

    it("has french horn mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS["french horn"]).toBe("treble");
    });

    it("has tuba mapped to bass clef", () => {
      expect(INSTRUMENT_CLEFS.tuba).toBe("bass");
    });

    it("has flute mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS.flute).toBe("treble");
    });

    it("has clarinet mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS.clarinet).toBe("treble");
    });

    it("has oboe mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS.oboe).toBe("treble");
    });

    it("has bassoon mapped to bass clef", () => {
      expect(INSTRUMENT_CLEFS.bassoon).toBe("bass");
    });

    it("has saxophone mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS.saxophone).toBe("treble");
    });

    it("has violin mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS.violin).toBe("treble");
    });

    it("has viola mapped to alto clef", () => {
      expect(INSTRUMENT_CLEFS.viola).toBe("alto");
    });

    it("has cello mapped to bass clef", () => {
      expect(INSTRUMENT_CLEFS.cello).toBe("bass");
    });

    it("has voice mapped to treble clef", () => {
      expect(INSTRUMENT_CLEFS.voice).toBe("treble");
    });

    it("contains all expected instruments", () => {
      const instrumentCount = Object.keys(INSTRUMENT_CLEFS).length;
      expect(instrumentCount).toBe(16);
    });
  });

  // ===========================================================================
  // BASS_CLEF_INSTRUMENTS Tests
  // ===========================================================================
  describe("BASS_CLEF_INSTRUMENTS", () => {
    it("includes Trombone", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Trombone");
    });

    it("includes Bass Trombone", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Bass Trombone");
    });

    it("includes Tuba", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Tuba");
    });

    it("includes Euphonium", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Euphonium");
    });

    it("includes Baritone", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Baritone");
    });

    it("includes Cello", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Cello");
    });

    it("includes Double Bass", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Double Bass");
    });

    it("includes Bassoon", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Bassoon");
    });

    it("includes Bass Guitar", () => {
      expect(BASS_CLEF_INSTRUMENTS).toContain("Bass Guitar");
    });

    it("has the expected count of instruments", () => {
      expect(BASS_CLEF_INSTRUMENTS.length).toBe(9);
    });
  });

  // ===========================================================================
  // getClefForInstrument Tests
  // ===========================================================================
  describe("getClefForInstrument", () => {
    it("returns both for piano", () => {
      expect(getClefForInstrument("piano")).toBe("both");
    });

    it("returns treble for trumpet", () => {
      expect(getClefForInstrument("trumpet")).toBe("treble");
    });

    it("returns bass for trombone", () => {
      expect(getClefForInstrument("trombone")).toBe("bass");
    });

    it("returns bass for bass trombone", () => {
      expect(getClefForInstrument("bass trombone")).toBe("bass");
    });

    it("returns alto for viola", () => {
      expect(getClefForInstrument("viola")).toBe("alto");
    });

    it("handles case-insensitive input", () => {
      expect(getClefForInstrument("PIANO")).toBe("both");
      expect(getClefForInstrument("Piano")).toBe("both");
      expect(getClefForInstrument("TRUMPET")).toBe("treble");
      expect(getClefForInstrument("TROMBONE")).toBe("bass");
    });

    it("returns treble as default for unknown instruments", () => {
      expect(getClefForInstrument("unknown")).toBe("treble");
      expect(getClefForInstrument("harmonica")).toBe("treble");
    });

    it("returns treble for null input", () => {
      expect(getClefForInstrument(null)).toBe("treble");
    });

    it("returns treble for undefined input", () => {
      expect(getClefForInstrument(undefined)).toBe("treble");
    });

    it("returns treble for empty string", () => {
      expect(getClefForInstrument("")).toBe("treble");
    });

    it("returns correct clef for french horn", () => {
      expect(getClefForInstrument("french horn")).toBe("treble");
    });

    it("returns correct clef for bassoon", () => {
      expect(getClefForInstrument("bassoon")).toBe("bass");
    });
  });
});

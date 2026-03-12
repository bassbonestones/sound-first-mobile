/**
 * Tests for instruments.js constants and utilities
 * Covers instrument data structures and helper functions
 */
import {
  instrumentFamilies,
  instrumentDefaults,
  getAllInstruments,
  getInstrument,
  getInstrumentFamily,
} from "../src/constants/instruments";

describe("instruments constants", () => {
  describe("instrumentFamilies", () => {
    it("contains Brass family", () => {
      expect(instrumentFamilies.Brass).toBeDefined();
      expect(instrumentFamilies.Brass.icon).toBe("🎺");
      expect(instrumentFamilies.Brass.instruments.length).toBeGreaterThan(0);
    });

    it("contains Woodwinds family", () => {
      expect(instrumentFamilies.Woodwinds).toBeDefined();
      expect(instrumentFamilies.Woodwinds.icon).toBe("🎷");
      expect(instrumentFamilies.Woodwinds.instruments.length).toBeGreaterThan(
        0,
      );
    });

    it("contains Strings family", () => {
      expect(instrumentFamilies.Strings).toBeDefined();
      expect(instrumentFamilies.Strings.icon).toBe("🎻");
    });

    it("contains Keyboard family", () => {
      expect(instrumentFamilies.Keyboard).toBeDefined();
      expect(instrumentFamilies.Keyboard.icon).toBe("🎹");
    });

    it("contains Voice family", () => {
      expect(instrumentFamilies.Voice).toBeDefined();
      expect(instrumentFamilies.Voice.icon).toBe("🎤");
    });

    it("contains Other family", () => {
      expect(instrumentFamilies.Other).toBeDefined();
      expect(instrumentFamilies.Other.icon).toBe("🎼");
    });

    it("each instrument has required properties", () => {
      Object.values(instrumentFamilies).forEach((family) => {
        family.instruments.forEach((instrument) => {
          expect(instrument.name).toBeDefined();
          expect(instrument.icon).toBeDefined();
          expect(instrument.clef).toMatch(/^(treble|bass)$/);
        });
      });
    });

    it("includes common brass instruments", () => {
      const brassNames = instrumentFamilies.Brass.instruments.map(
        (i) => i.name,
      );
      expect(brassNames).toContain("Trumpet");
      expect(brassNames).toContain("French Horn");
      expect(brassNames).toContain("Tenor Trombone");
      expect(brassNames).toContain("Tuba");
    });

    it("includes common woodwind instruments", () => {
      const woodwindNames = instrumentFamilies.Woodwinds.instruments.map(
        (i) => i.name,
      );
      expect(woodwindNames).toContain("Flute");
      expect(woodwindNames).toContain("Clarinet");
      expect(woodwindNames).toContain("Alto Saxophone");
    });

    it("includes common string instruments", () => {
      const stringNames = instrumentFamilies.Strings.instruments.map(
        (i) => i.name,
      );
      expect(stringNames).toContain("Violin");
      expect(stringNames).toContain("Cello");
      expect(stringNames).toContain("Guitar");
    });
  });

  describe("instrumentDefaults", () => {
    it("has defaults for Piano", () => {
      expect(instrumentDefaults.Piano).toEqual({
        startingNote: "C4",
        clef: "treble",
      });
    });

    it("has defaults for Trumpet", () => {
      expect(instrumentDefaults.Trumpet).toEqual({
        startingNote: "Bb4",
        clef: "treble",
      });
    });

    it("has defaults for bass instruments", () => {
      expect(instrumentDefaults.Cello.clef).toBe("bass");
      expect(instrumentDefaults["Tenor Trombone"].clef).toBe("bass");
      expect(instrumentDefaults.Tuba.clef).toBe("bass");
    });

    it("all defaults have startingNote and clef", () => {
      Object.values(instrumentDefaults).forEach((defaults) => {
        expect(defaults.startingNote).toBeDefined();
        expect(defaults.clef).toBeDefined();
      });
    });
  });
});

describe("getAllInstruments", () => {
  it("returns an array", () => {
    const instruments = getAllInstruments();
    expect(Array.isArray(instruments)).toBe(true);
  });

  it("returns all instruments from all families", () => {
    const instruments = getAllInstruments();

    // Count total instruments across all families manually
    let expected = 0;
    Object.values(instrumentFamilies).forEach((family) => {
      expected += family.instruments.length;
    });

    expect(instruments.length).toBe(expected);
  });

  it("includes instruments from different families", () => {
    const instruments = getAllInstruments();
    const names = instruments.map((i) => i.name);

    // Check for instruments from different families
    expect(names).toContain("Trumpet"); // Brass
    expect(names).toContain("Flute"); // Woodwinds
    expect(names).toContain("Violin"); // Strings
    expect(names).toContain("Piano"); // Keyboard
    expect(names).toContain("Soprano"); // Voice
  });

  it("each instrument has required properties", () => {
    const instruments = getAllInstruments();
    instruments.forEach((instrument) => {
      expect(instrument.name).toBeDefined();
      expect(instrument.icon).toBeDefined();
      expect(instrument.clef).toBeDefined();
    });
  });
});

describe("getInstrument", () => {
  it("finds Trumpet", () => {
    const instrument = getInstrument("Trumpet");
    expect(instrument).toEqual({
      name: "Trumpet",
      icon: "🎺",
      clef: "treble",
    });
  });

  it("finds Piano", () => {
    const instrument = getInstrument("Piano");
    expect(instrument).toBeDefined();
    expect(instrument?.name).toBe("Piano");
    expect(instrument?.clef).toBe("treble");
  });

  it("finds Cello", () => {
    const instrument = getInstrument("Cello");
    expect(instrument).toBeDefined();
    expect(instrument?.clef).toBe("bass");
  });

  it("returns null for unknown instrument", () => {
    expect(getInstrument("Unknown Instrument")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getInstrument("")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(getInstrument(undefined)).toBeNull();
  });

  it("is case-sensitive", () => {
    expect(getInstrument("trumpet")).toBeNull();
    expect(getInstrument("TRUMPET")).toBeNull();
    expect(getInstrument("Trumpet")).toBeDefined();
  });
});

describe("getInstrumentFamily", () => {
  it("returns Brass for Trumpet", () => {
    expect(getInstrumentFamily("Trumpet")).toBe("Brass");
  });

  it("returns Brass for Tuba", () => {
    expect(getInstrumentFamily("Tuba")).toBe("Brass");
  });

  it("returns Woodwinds for Flute", () => {
    expect(getInstrumentFamily("Flute")).toBe("Woodwinds");
  });

  it("returns Woodwinds for Alto Saxophone", () => {
    expect(getInstrumentFamily("Alto Saxophone")).toBe("Woodwinds");
  });

  it("returns Strings for Violin", () => {
    expect(getInstrumentFamily("Violin")).toBe("Strings");
  });

  it("returns Strings for Guitar", () => {
    expect(getInstrumentFamily("Guitar")).toBe("Strings");
  });

  it("returns Keyboard for Piano", () => {
    expect(getInstrumentFamily("Piano")).toBe("Keyboard");
  });

  it("returns Voice for Soprano", () => {
    expect(getInstrumentFamily("Soprano")).toBe("Voice");
  });

  it("returns Other for Mallet Percussion", () => {
    expect(getInstrumentFamily("Mallet Percussion")).toBe("Other");
  });

  it("returns null for unknown instrument", () => {
    expect(getInstrumentFamily("Unknown")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getInstrumentFamily("")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(getInstrumentFamily(undefined)).toBeNull();
  });
});

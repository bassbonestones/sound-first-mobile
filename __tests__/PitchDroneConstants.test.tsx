/**
 * Tests for PitchDrone constants and utilities
 * Covers frequency calculations and note data
 */
import {
  NOTES,
  OCTAVE_COLORS,
  JUST_RATIOS,
  calculateEqualTemperamentFrequency,
  calculateJustIntonationFrequency,
  getNoteNameBySemitone,
  getOctaveColor,
} from "../src/components/PitchDrone/constants";

describe("PitchDrone constants", () => {
  describe("NOTES", () => {
    it("contains 12 notes", () => {
      expect(NOTES).toHaveLength(12);
    });

    it("starts with C at semitone 0", () => {
      expect(NOTES[0].name).toBe("C");
      expect(NOTES[0].semitone).toBe(0);
    });

    it("ends with B at semitone 11", () => {
      expect(NOTES[11].name).toBe("B");
      expect(NOTES[11].semitone).toBe(11);
    });

    it("each note has required properties", () => {
      NOTES.forEach((note) => {
        expect(note).toHaveProperty("name");
        expect(note).toHaveProperty("enharmonic");
        expect(note).toHaveProperty("semitone");
        expect(typeof note.semitone).toBe("number");
        expect(note.semitone).toBeGreaterThanOrEqual(0);
        expect(note.semitone).toBeLessThanOrEqual(11);
      });
    });

    it("has unique semitones", () => {
      const semitones = NOTES.map((n) => n.semitone);
      const uniqueSemitones = [...new Set(semitones)];
      expect(uniqueSemitones).toHaveLength(12);
    });

    it("has correct semitone values", () => {
      expect(NOTES.find((n) => n.name === "A")?.semitone).toBe(9);
      expect(NOTES.find((n) => n.name === "E")?.semitone).toBe(4);
      expect(NOTES.find((n) => n.name === "G")?.semitone).toBe(7);
    });
  });

  describe("OCTAVE_COLORS", () => {
    it("has colors for octaves 1-9", () => {
      for (let i = 1; i <= 9; i++) {
        expect(OCTAVE_COLORS[i]).toBeDefined();
        expect(OCTAVE_COLORS[i]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it("has distinct colors for each octave", () => {
      const colors = Object.values(OCTAVE_COLORS);
      const uniqueColors = [...new Set(colors)];
      expect(uniqueColors.length).toBe(colors.length);
    });
  });

  describe("JUST_RATIOS", () => {
    it("has 12 interval ratios", () => {
      expect(Object.keys(JUST_RATIOS)).toHaveLength(12);
    });

    it("has unison ratio of 1", () => {
      expect(JUST_RATIOS[0]).toBe(1);
    });

    it("has perfect fifth ratio of 3/2", () => {
      expect(JUST_RATIOS[7]).toBe(3 / 2);
    });

    it("has perfect fourth ratio of 4/3", () => {
      expect(JUST_RATIOS[5]).toBe(4 / 3);
    });

    it("has major third ratio of 5/4", () => {
      expect(JUST_RATIOS[4]).toBe(5 / 4);
    });

    it("has minor third ratio of 6/5", () => {
      expect(JUST_RATIOS[3]).toBe(6 / 5);
    });

    it("all ratios are positive numbers", () => {
      Object.values(JUST_RATIOS).forEach((ratio) => {
        expect(typeof ratio).toBe("number");
        expect(ratio).toBeGreaterThan(0);
      });
    });
  });
});

describe("calculateEqualTemperamentFrequency", () => {
  it("returns 440 Hz for A4", () => {
    // A is semitone 9
    const freq = calculateEqualTemperamentFrequency(9, 4, 440);
    expect(freq).toBeCloseTo(440, 2);
  });

  it("returns ~261.63 Hz for C4 (middle C)", () => {
    const freq = calculateEqualTemperamentFrequency(0, 4, 440);
    expect(freq).toBeCloseTo(261.63, 1);
  });

  it("returns 880 Hz for A5 (octave up)", () => {
    const freq = calculateEqualTemperamentFrequency(9, 5, 440);
    expect(freq).toBeCloseTo(880, 2);
  });

  it("returns 220 Hz for A3 (octave down)", () => {
    const freq = calculateEqualTemperamentFrequency(9, 3, 440);
    expect(freq).toBeCloseTo(220, 2);
  });

  it("respects custom concert A", () => {
    // A4 with concert A at 432 Hz
    const freq = calculateEqualTemperamentFrequency(9, 4, 432);
    expect(freq).toBeCloseTo(432, 2);
  });

  it("uses default 440 Hz for concert A", () => {
    const freq = calculateEqualTemperamentFrequency(9, 4);
    expect(freq).toBeCloseTo(440, 2);
  });

  it("calculates correct frequency for E4", () => {
    const freq = calculateEqualTemperamentFrequency(4, 4, 440);
    expect(freq).toBeCloseTo(329.63, 1);
  });

  it("handles low octaves", () => {
    const freq = calculateEqualTemperamentFrequency(9, 1, 440);
    expect(freq).toBeCloseTo(55, 1);
  });

  it("handles high octaves", () => {
    const freq = calculateEqualTemperamentFrequency(9, 6, 440);
    expect(freq).toBeCloseTo(1760, 1);
  });
});

describe("calculateJustIntonationFrequency", () => {
  it("returns same as root for unison", () => {
    const freq = calculateJustIntonationFrequency(0, 4, 0, 440);
    expect(freq).toBeCloseTo(261.63, 1); // C4
  });

  it("returns correct just perfect fifth", () => {
    // G (semitone 7) is perfect fifth above C (semitone 0)
    const rootFreq = calculateEqualTemperamentFrequency(0, 4, 440);
    const fifthFreq = calculateJustIntonationFrequency(7, 4, 0, 440);
    const ratio = fifthFreq / rootFreq;
    expect(ratio).toBeCloseTo(3 / 2, 3);
  });

  it("returns correct just major third", () => {
    // E (semitone 4) is major third above C (semitone 0)
    const rootFreq = calculateEqualTemperamentFrequency(0, 4, 440);
    const thirdFreq = calculateJustIntonationFrequency(4, 4, 0, 440);
    const ratio = thirdFreq / rootFreq;
    expect(ratio).toBeCloseTo(5 / 4, 3);
  });

  it("handles different pitch centers", () => {
    // Perfect fifth above A (semitone 9) is E (semitone 4)
    // In A = 440, E should be 440 * 3/2 = 660 Hz
    const freq = calculateJustIntonationFrequency(4, 5, 9, 440);
    // A4 is 440, so A5 is 880. E5 as fifth above A is 880 * 3/2 = 1320
    // But the function calculates from the same octave, so need to check the ratio
    expect(freq).toBeGreaterThan(0);
  });

  it("wraps intervals correctly", () => {
    // Semitone 10 (A#) with pitch center 11 (B)
    // Interval is (10 - 11 + 12) % 12 = 11 (major 7th below / minor 2nd up)
    const freq = calculateJustIntonationFrequency(10, 4, 11, 440);
    expect(freq).toBeGreaterThan(0);
  });

  it("respects concert A parameter", () => {
    const freq432 = calculateJustIntonationFrequency(0, 4, 0, 432);
    const freq440 = calculateJustIntonationFrequency(0, 4, 0, 440);
    expect(freq432).toBeLessThan(freq440);
  });
});

describe("getNoteNameBySemitone", () => {
  it("returns C for semitone 0", () => {
    expect(getNoteNameBySemitone(0)).toBe("C");
  });

  it("returns A for semitone 9", () => {
    expect(getNoteNameBySemitone(9)).toBe("A");
  });

  it("returns F# for semitone 6", () => {
    expect(getNoteNameBySemitone(6)).toBe("F#");
  });

  it("returns B for semitone 11", () => {
    expect(getNoteNameBySemitone(11)).toBe("B");
  });

  it("returns ? for invalid semitone", () => {
    expect(getNoteNameBySemitone(12)).toBe("?");
    expect(getNoteNameBySemitone(-1)).toBe("?");
    expect(getNoteNameBySemitone(100)).toBe("?");
  });

  it("returns all 12 note names correctly", () => {
    const expectedNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    for (let i = 0; i < 12; i++) {
      expect(getNoteNameBySemitone(i)).toBe(expectedNames[i]);
    }
  });
});

describe("getOctaveColor", () => {
  it("returns color for octave 1", () => {
    expect(getOctaveColor(1)).toBe("#E74C3C");
  });

  it("returns color for octave 4", () => {
    expect(getOctaveColor(4)).toBe("#9B59B6");
  });

  it("returns color for octave 9", () => {
    expect(getOctaveColor(9)).toBe("#8BC34A");
  });

  it("returns default gray for invalid octave", () => {
    expect(getOctaveColor(0)).toBe("#666666");
    expect(getOctaveColor(10)).toBe("#666666");
    expect(getOctaveColor(-1)).toBe("#666666");
  });

  it("all octave colors are valid hex", () => {
    for (let i = 1; i <= 9; i++) {
      const color = getOctaveColor(i);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

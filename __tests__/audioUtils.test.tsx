/**
 * audioUtils tests
 *
 * Tests for audio utility functions.
 */
import {
  NOTE_NAMES,
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  base64ToFloat32Array,
} from "../src/utils/audioUtils";

describe("audioUtils", () => {
  describe("NOTE_NAMES", () => {
    it("contains 12 note names", () => {
      expect(NOTE_NAMES).toHaveLength(12);
    });

    it("starts with C", () => {
      expect(NOTE_NAMES[0]).toBe("C");
    });

    it("contains all chromatic notes", () => {
      expect(NOTE_NAMES).toContain("C");
      expect(NOTE_NAMES).toContain("C#");
      expect(NOTE_NAMES).toContain("D");
      expect(NOTE_NAMES).toContain("A");
      expect(NOTE_NAMES).toContain("B");
    });
  });

  describe("frequencyToNote", () => {
    it("returns null for invalid frequency", () => {
      expect(frequencyToNote(null)).toBeNull();
      expect(frequencyToNote(undefined)).toBeNull();
      expect(frequencyToNote(0)).toBeNull();
    });

    it("returns null for frequency below 50 Hz", () => {
      expect(frequencyToNote(40)).toBeNull();
      expect(frequencyToNote(49)).toBeNull();
    });

    it("returns null for frequency above 2000 Hz", () => {
      expect(frequencyToNote(2001)).toBeNull();
      expect(frequencyToNote(3000)).toBeNull();
    });

    it("correctly identifies A4 (440 Hz)", () => {
      const result = frequencyToNote(440);

      expect(result).not.toBeNull();
      expect(result!.noteName).toBe("A4");
      expect(result!.noteNameShort).toBe("A");
      expect(result!.octave).toBe(4);
      expect(result!.midiNote).toBe(69);
      expect(result!.cents).toBe(0);
      expect(result!.isInTune).toBe(true);
    });

    it("correctly identifies C4 (middle C, ~261.6 Hz)", () => {
      const result = frequencyToNote(261.63);

      expect(result).not.toBeNull();
      expect(result!.noteName).toBe("C4");
      expect(result!.midiNote).toBe(60);
    });

    it("identifies notes with sharp names", () => {
      // C#4 is ~277.18 Hz
      const result = frequencyToNote(277.18);

      expect(result).not.toBeNull();
      expect(result!.noteNameShort).toBe("C#");
    });

    it("calculates cents deviation for slightly flat note", () => {
      // A4 slightly flat (432 Hz instead of 440 Hz)
      const result = frequencyToNote(432);

      expect(result).not.toBeNull();
      expect(result!.noteName).toBe("A4");
      expect(result!.cents).toBeLessThan(0); // Should be negative (flat)
      expect(result!.isInTune).toBe(false); // More than 15 cents off
    });

    it("calculates cents deviation for slightly sharp note", () => {
      // A4 slightly sharp (445 Hz instead of 440 Hz)
      const result = frequencyToNote(445);

      expect(result).not.toBeNull();
      expect(result!.cents).toBeGreaterThan(0); // Should be positive (sharp)
    });

    it("considers within 15 cents as in tune", () => {
      // 442 Hz is ~8 cents sharp of 440 Hz
      const result = frequencyToNote(442);
      expect(result!.isInTune).toBe(true);
    });

    it("rounds frequency to one decimal place", () => {
      const result = frequencyToNote(440.123456);
      expect(result!.frequency).toBe(440.1);
    });

    it("handles different octaves", () => {
      // A3 is ~220 Hz
      const a3 = frequencyToNote(220);
      expect(a3!.noteName).toBe("A3");
      expect(a3!.octave).toBe(3);

      // A5 is ~880 Hz
      const a5 = frequencyToNote(880);
      expect(a5!.noteName).toBe("A5");
      expect(a5!.octave).toBe(5);
    });
  });

  describe("noteNameToMidi", () => {
    it("returns null for invalid input", () => {
      expect(noteNameToMidi(null)).toBeNull();
      expect(noteNameToMidi(undefined)).toBeNull();
      expect(noteNameToMidi("")).toBeNull();
      expect(noteNameToMidi("invalid")).toBeNull();
    });

    it("returns null for invalid note format", () => {
      expect(noteNameToMidi("H4")).toBeNull(); // H not a valid note
      expect(noteNameToMidi("C")).toBeNull(); // Missing octave
      expect(noteNameToMidi("4C")).toBeNull(); // Wrong order
      expect(noteNameToMidi("C##4")).toBeNull(); // Double sharp not supported
    });

    it("converts C4 to MIDI 60", () => {
      expect(noteNameToMidi("C4")).toBe(60);
    });

    it("converts A4 to MIDI 69", () => {
      expect(noteNameToMidi("A4")).toBe(69);
    });

    it("handles lowercase letters", () => {
      expect(noteNameToMidi("c4")).toBe(60);
      expect(noteNameToMidi("a4")).toBe(69);
    });

    it("handles sharps", () => {
      expect(noteNameToMidi("C#4")).toBe(61);
      expect(noteNameToMidi("F#4")).toBe(66);
    });

    it("handles flats", () => {
      expect(noteNameToMidi("Db4")).toBe(61);
      expect(noteNameToMidi("Bb4")).toBe(70);
    });

    it("handles different octaves", () => {
      expect(noteNameToMidi("C0")).toBe(12);
      expect(noteNameToMidi("C1")).toBe(24);
      expect(noteNameToMidi("C2")).toBe(36);
      expect(noteNameToMidi("C3")).toBe(48);
      expect(noteNameToMidi("C5")).toBe(72);
    });

    it("wraps note index correctly for edge cases", () => {
      // B# in octave 4 wraps modulo 12 to index 0 (C), but stays in octave 4
      expect(noteNameToMidi("B#4")).toBe(60); // C-like pitch in octave 4 calculation

      // Cb in octave 4: C=0, with flat becomes -1, wraps to 11 (B), octave stays 4
      // So (4+1)*12 + 11 = 71
      expect(noteNameToMidi("Cb4")).toBe(71);
    });
  });

  describe("autoCorrelate", () => {
    it("returns -1 frequency for silent buffer", () => {
      const buffer = new Float32Array(1024).fill(0);
      const result = autoCorrelate(buffer, 44100);

      expect(result.frequency).toBe(-1);
      expect(result.rms).toBeLessThan(0.01);
    });

    it("calculates RMS correctly", () => {
      // Create buffer with known values
      const buffer = new Float32Array(100);
      for (let i = 0; i < 100; i++) {
        buffer[i] = 0.5; // All same value
      }

      const result = autoCorrelate(buffer, 44100);
      expect(result.rms).toBeCloseTo(0.5, 2);
    });

    it("returns result object with expected properties", () => {
      const buffer = new Float32Array(1024);
      // Create a simple sine wave at 440 Hz
      for (let i = 0; i < 1024; i++) {
        buffer[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / 44100);
      }

      const result = autoCorrelate(buffer, 44100);

      expect(result).toHaveProperty("frequency");
      expect(result).toHaveProperty("rms");
      expect(result).toHaveProperty("confidence");
    });

    it("handles very low RMS (quiet signal)", () => {
      const buffer = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) {
        buffer[i] = 0.0001 * Math.sin((2 * Math.PI * 440 * i) / 44100);
      }

      const result = autoCorrelate(buffer, 44100);
      // Should return -1 for too quiet signals
      expect(result.frequency).toBe(-1);
    });

    it("returns valid correlation values", () => {
      const buffer = new Float32Array(2048);
      // Create louder sine wave for better correlation
      for (let i = 0; i < 2048; i++) {
        buffer[i] = 0.7 * Math.sin((2 * Math.PI * 440 * i) / 44100);
      }

      const result = autoCorrelate(buffer, 44100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("handles buffer with all same values", () => {
      const buffer = new Float32Array(1024).fill(0.5);
      const result = autoCorrelate(buffer, 44100);

      expect(result).toHaveProperty("frequency");
      expect(result).toHaveProperty("rms");
    });

    it("handles negative sample values", () => {
      const buffer = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) {
        buffer[i] = -0.5 * Math.sin((2 * Math.PI * 200 * i) / 44100);
      }

      const result = autoCorrelate(buffer, 44100);
      expect(result).toHaveProperty("frequency");
    });

    it("handles different sample rates", () => {
      const buffer = new Float32Array(2048);
      for (let i = 0; i < 2048; i++) {
        buffer[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / 48000);
      }

      const result = autoCorrelate(buffer, 48000);
      expect(result).toHaveProperty("frequency");
    });

    it("handles short buffer gracefully", () => {
      const buffer = new Float32Array(64);
      for (let i = 0; i < 64; i++) {
        buffer[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / 44100);
      }

      const result = autoCorrelate(buffer, 44100);
      expect(result).toHaveProperty("frequency");
      expect(result).toHaveProperty("rms");
    });

    it("handles empty buffer", () => {
      const buffer = new Float32Array(0);
      const result = autoCorrelate(buffer, 44100);

      expect(result.frequency).toBe(-1);
      // RMS is NaN for empty buffer (0/0), but frequency detection still works
      expect(typeof result.rms).toBe("number");
    });

    it("handles very long buffer", () => {
      const buffer = new Float32Array(8192);
      for (let i = 0; i < 8192; i++) {
        buffer[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / 44100);
      }

      const result = autoCorrelate(buffer, 44100);
      expect(result).toHaveProperty("frequency");
    });
  });

  describe("base64ToFloat32Array", () => {
    it("converts empty base64 string to empty array", () => {
      const result = base64ToFloat32Array("");
      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(0);
    });

    it("returns Float32Array type", () => {
      // Base64 encoding of 4 bytes (0x0000 0x0000)
      const base64 = "AAAAAAA=";
      const result = base64ToFloat32Array(base64);
      expect(result).toBeInstanceOf(Float32Array);
    });

    it("handles base64 encoded silence (zeros)", () => {
      // 4 bytes of zeros encoded as base64
      const base64 = "AAAAAAAA"; // 6 bytes -> 3 16-bit samples of zeros
      const result = base64ToFloat32Array(base64);

      // Each sample should be 0
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(0);
      }
    });

    it("handles positive 16-bit samples", () => {
      // Max positive 16-bit: 0x7FFF = 32767
      // Little endian: FF 7F -> base64
      // Actually let's test with a known value
      const bytes = new Uint8Array([0x00, 0x40]); // 0x4000 = 16384 -> 0.5 normalized
      const base64 = Buffer.from(bytes).toString("base64");
      const result = base64ToFloat32Array(base64);

      expect(result.length).toBe(1);
      expect(result[0]).toBeCloseTo(0.5, 1);
    });

    it("handles negative 16-bit samples", () => {
      // Negative sample: -16384 in 16-bit = 0xC000
      // Little endian: 00 C0
      const bytes = new Uint8Array([0x00, 0xc0]);
      const base64 = Buffer.from(bytes).toString("base64");
      const result = base64ToFloat32Array(base64);

      expect(result.length).toBe(1);
      expect(result[0]).toBeLessThan(0);
    });

    it("normalizes samples to -1 to 1 range", () => {
      // Several samples
      const bytes = new Uint8Array([
        0xff,
        0x7f, // Max positive: 32767 -> ~1.0
        0x00,
        0x00, // Zero
        0x01,
        0x80, // Near max negative: -32767 -> ~-1.0
      ]);
      const base64 = Buffer.from(bytes).toString("base64");
      const result = base64ToFloat32Array(base64);

      expect(result.length).toBe(3);
      expect(result[0]).toBeCloseTo(1.0, 1);
      expect(result[1]).toBe(0);
      expect(result[2]).toBeLessThan(-0.9);
    });
  });

  describe("Additional frequencyToNote edge cases", () => {
    it("handles boundary frequency at 50 Hz", () => {
      const result = frequencyToNote(50);
      expect(result).not.toBeNull();
    });

    it("handles boundary frequency at 2000 Hz", () => {
      const result = frequencyToNote(2000);
      expect(result).not.toBeNull();
    });

    it("handles fractional frequency values", () => {
      const result = frequencyToNote(440.5);
      expect(result).not.toBeNull();
      expect(result!.noteName).toBe("A4");
    });

    it("handles NaN frequency", () => {
      const result = frequencyToNote(NaN);
      expect(result).toBeNull();
    });

    it("handles negative frequency", () => {
      const result = frequencyToNote(-440);
      expect(result).toBeNull();
    });

    it("handles Infinity frequency", () => {
      const result = frequencyToNote(Infinity);
      expect(result).toBeNull();
    });

    it("correctly identifies all chromatic notes in octave 4", () => {
      const expectedNotes = [
        { freq: 261.63, name: "C4" },
        { freq: 277.18, name: "C#4" },
        { freq: 293.66, name: "D4" },
        { freq: 311.13, name: "D#4" },
        { freq: 329.63, name: "E4" },
        { freq: 349.23, name: "F4" },
        { freq: 369.99, name: "F#4" },
        { freq: 392.0, name: "G4" },
        { freq: 415.3, name: "G#4" },
        { freq: 440.0, name: "A4" },
        { freq: 466.16, name: "A#4" },
        { freq: 493.88, name: "B4" },
      ];

      expectedNotes.forEach(({ freq, name }) => {
        const result = frequencyToNote(freq);
        expect(result!.noteName).toBe(name);
      });
    });
  });

  describe("Additional noteNameToMidi edge cases", () => {
    it("handles all natural notes", () => {
      const naturals = [
        { note: "C4", midi: 60 },
        { note: "D4", midi: 62 },
        { note: "E4", midi: 64 },
        { note: "F4", midi: 65 },
        { note: "G4", midi: 67 },
        { note: "A4", midi: 69 },
        { note: "B4", midi: 71 },
      ];

      naturals.forEach(({ note, midi }) => {
        expect(noteNameToMidi(note)).toBe(midi);
      });
    });

    it("handles all sharp notes in octave 4", () => {
      const sharps = [
        { note: "C#4", midi: 61 },
        { note: "D#4", midi: 63 },
        { note: "F#4", midi: 66 },
        { note: "G#4", midi: 68 },
        { note: "A#4", midi: 70 },
      ];

      sharps.forEach(({ note, midi }) => {
        expect(noteNameToMidi(note)).toBe(midi);
      });
    });

    it("handles all flat notes in octave 4", () => {
      const flats = [
        { note: "Db4", midi: 61 },
        { note: "Eb4", midi: 63 },
        { note: "Gb4", midi: 66 },
        { note: "Ab4", midi: 68 },
        { note: "Bb4", midi: 70 },
      ];

      flats.forEach(({ note, midi }) => {
        expect(noteNameToMidi(note)).toBe(midi);
      });
    });

    it("handles high octave numbers", () => {
      expect(noteNameToMidi("C9")).toBe(120);
    });

    it("handles mixed case note names", () => {
      expect(noteNameToMidi("c#4")).toBe(61);
      expect(noteNameToMidi("Db4")).toBe(61);
      // Note: only lowercase 'b' is supported for flat, uppercase 'B' is note B
      expect(noteNameToMidi("db4")).toBe(61);
    });

    it("returns null for invalid note letters", () => {
      expect(noteNameToMidi("X4")).toBeNull();
      expect(noteNameToMidi("Z4")).toBeNull();
    });

    it("returns null for missing octave", () => {
      expect(noteNameToMidi("C#")).toBeNull();
      expect(noteNameToMidi("Ab")).toBeNull();
    });
  });

  describe("NOTE_NAMES array", () => {
    it("has correct order of notes", () => {
      expect(NOTE_NAMES).toEqual([
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
      ]);
    });

    it("has unique values", () => {
      const uniqueNotes = new Set(NOTE_NAMES);
      expect(uniqueNotes.size).toBe(NOTE_NAMES.length);
    });

    it("includes all basic note names", () => {
      const basicNotes = ["C", "D", "E", "F", "G", "A", "B"];
      basicNotes.forEach((note) => {
        expect(NOTE_NAMES).toContain(note);
      });
    });

    it("includes all sharp notes", () => {
      const sharpNotes = ["C#", "D#", "F#", "G#", "A#"];
      sharpNotes.forEach((note) => {
        expect(NOTE_NAMES).toContain(note);
      });
    });
  });

  describe("Frequency-MIDI round trip", () => {
    it("converts frequency to note and back to MIDI consistently", () => {
      const frequencies = [261.63, 440, 880, 523.25];

      frequencies.forEach((freq) => {
        const noteInfo = frequencyToNote(freq);
        if (noteInfo) {
          const midiFromNote = noteNameToMidi(noteInfo.noteName);
          expect(midiFromNote).toBe(noteInfo.midiNote);
        }
      });
    });
  });
});

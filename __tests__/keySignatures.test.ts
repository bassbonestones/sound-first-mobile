/**
 * Key Signatures Constants Tests
 *
 * Tests for the shared key signature constants and utilities.
 */

import {
  KEY_NAMES,
  KEY_NAMES_SHORT,
  KEY_SIGNATURES,
  getKeyName,
  getKeyNameShort,
  getKeySignature,
  ALL_KEY_SIGNATURES,
  KEY_SIGNATURE_RANGE,
} from "../src/features/composer/constants";

describe("KEY_NAMES", () => {
  it("should have all 15 keys (-7 to +7)", () => {
    expect(Object.keys(KEY_NAMES).length).toBe(15);
  });

  it("should have C Major at 0", () => {
    expect(KEY_NAMES[0]).toBe("C Major");
  });

  it("should have flat keys for negative values", () => {
    expect(KEY_NAMES[-3]).toBe("E♭ Major");
    expect(KEY_NAMES[-2]).toBe("B♭ Major");
    expect(KEY_NAMES[-1]).toBe("F Major");
  });

  it("should have sharp keys for positive values", () => {
    expect(KEY_NAMES[1]).toBe("G Major");
    expect(KEY_NAMES[2]).toBe("D Major");
    expect(KEY_NAMES[6]).toBe("F♯ Major");
    expect(KEY_NAMES[7]).toBe("C♯ Major");
  });

  it("should use proper unicode symbols", () => {
    expect(KEY_NAMES[-7]).toContain("♭");
    expect(KEY_NAMES[7]).toContain("♯");
  });
});

describe("KEY_NAMES_SHORT", () => {
  it("should have all 15 keys (-7 to +7)", () => {
    expect(Object.keys(KEY_NAMES_SHORT).length).toBe(15);
  });

  it("should have C at 0", () => {
    expect(KEY_NAMES_SHORT[0]).toBe("C");
  });

  it("should have just root notes without 'Major'", () => {
    expect(KEY_NAMES_SHORT[2]).toBe("D");
    expect(KEY_NAMES_SHORT[-3]).toBe("E♭");
    expect(KEY_NAMES_SHORT[6]).toBe("F♯");
  });
});

describe("KEY_SIGNATURES", () => {
  it("should have all 15 keys", () => {
    expect(Object.keys(KEY_SIGNATURES).length).toBe(15);
  });

  it("should have both major and minor for each key", () => {
    expect(KEY_SIGNATURES[0].major).toBe("C Major");
    expect(KEY_SIGNATURES[0].minor).toBe("A Minor");
  });

  it("should have correct relative minor keys", () => {
    // A minor is relative to C Major
    expect(KEY_SIGNATURES[0].minor).toBe("A Minor");
    // E minor is relative to G Major
    expect(KEY_SIGNATURES[1].minor).toBe("E Minor");
    // C minor is relative to Eb Major
    expect(KEY_SIGNATURES[-3].minor).toBe("C Minor");
  });
});

describe("getKeyName", () => {
  it("should return correct key name for valid values", () => {
    expect(getKeyName(0)).toBe("C Major");
    expect(getKeyName(-3)).toBe("E♭ Major");
    expect(getKeyName(2)).toBe("D Major");
  });

  it("should default to C Major for invalid values", () => {
    expect(getKeyName(99)).toBe("C Major");
    expect(getKeyName(-99)).toBe("C Major");
  });
});

describe("getKeyNameShort", () => {
  it("should return correct short name for valid values", () => {
    expect(getKeyNameShort(0)).toBe("C");
    expect(getKeyNameShort(-3)).toBe("E♭");
    expect(getKeyNameShort(2)).toBe("D");
  });

  it("should default to C for invalid values", () => {
    expect(getKeyNameShort(99)).toBe("C");
    expect(getKeyNameShort(-99)).toBe("C");
  });
});

describe("getKeySignature", () => {
  it("should return correct key info for valid values", () => {
    const c = getKeySignature(0);
    expect(c.major).toBe("C Major");
    expect(c.minor).toBe("A Minor");
  });

  it("should default to C Major / A Minor for invalid values", () => {
    const invalid = getKeySignature(99);
    expect(invalid.major).toBe("C Major");
    expect(invalid.minor).toBe("A Minor");
  });
});

describe("ALL_KEY_SIGNATURES", () => {
  it("should contain all 15 values from -7 to 7", () => {
    expect(ALL_KEY_SIGNATURES).toHaveLength(15);
    expect(ALL_KEY_SIGNATURES[0]).toBe(-7);
    expect(ALL_KEY_SIGNATURES[7]).toBe(0);
    expect(ALL_KEY_SIGNATURES[14]).toBe(7);
  });
});

describe("KEY_SIGNATURE_RANGE", () => {
  it("should define min as -7 and max as 7", () => {
    expect(KEY_SIGNATURE_RANGE.min).toBe(-7);
    expect(KEY_SIGNATURE_RANGE.max).toBe(7);
  });
});

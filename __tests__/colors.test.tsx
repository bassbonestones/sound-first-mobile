/**
 * Tests for colors constants
 * Verifies color values and theme definitions
 */
import {
  colors,
  spacing,
  fontSizes,
  borderRadius,
} from "../src/constants/colors";
import colorsDefault from "../src/constants/colors";

describe("colors constants", () => {
  describe("primary colors", () => {
    it("has valid hex color format", () => {
      expect(colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.primaryDark).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.primaryLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("primary is blue", () => {
      expect(colors.primary).toBe("#2196F3");
    });
  });

  describe("semantic colors", () => {
    it("has success colors (green)", () => {
      expect(colors.success).toBe("#4CAF50");
      expect(colors.successLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has warning colors (orange)", () => {
      expect(colors.warning).toBe("#FF9800");
      expect(colors.warningLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has error colors (red)", () => {
      expect(colors.error).toBe("#f44336");
      expect(colors.errorLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.errorDark).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe("grayscale colors", () => {
    it("has white", () => {
      expect(colors.white).toBe("#ffffff");
    });

    it("has background colors", () => {
      expect(colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.surface).toBe("#ffffff");
      expect(colors.surfaceLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has border colors", () => {
      expect(colors.border).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
      expect(colors.borderDark).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
      expect(colors.divider).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe("text colors", () => {
    it("has all text colors", () => {
      expect(colors.textPrimary).toBeDefined();
      expect(colors.textSecondary).toBeDefined();
      expect(colors.textTertiary).toBeDefined();
      expect(colors.textDisabled).toBeDefined();
      expect(colors.textLight).toBeDefined();
    });

    it("textLight is white or very light", () => {
      expect(colors.textLight).toBe("#fff");
    });
  });

  describe("session/practice colors", () => {
    it("has dark session background", () => {
      expect(colors.sessionBg).toBe("#1a1410");
    });

    it("has gold accent", () => {
      expect(colors.sessionGold).toBe("#FFD700");
      expect(colors.sessionText).toBe("#FFD700");
    });

    it("has header background", () => {
      expect(colors.headerBg).toBe("#1a237e");
    });
  });

  describe("UI element colors", () => {
    it("has input background", () => {
      expect(colors.inputBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has chip colors", () => {
      expect(colors.chipBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.chipActiveBg).toBe("#2196F3"); // Primary blue
    });

    it("has soft gate color", () => {
      expect(colors.softGate).toBe("#9C27B0"); // Purple
    });
  });

  describe("mastery colors", () => {
    it("has all 6 mastery levels", () => {
      expect(colors.mastery.level0).toBeDefined();
      expect(colors.mastery.level1).toBeDefined();
      expect(colors.mastery.level2).toBeDefined();
      expect(colors.mastery.level3).toBeDefined();
      expect(colors.mastery.level4).toBeDefined();
      expect(colors.mastery.level5).toBeDefined();
    });

    it("level0 is gray (not started)", () => {
      expect(colors.mastery.level0).toBe("#9E9E9E");
    });

    it("level1 is red (just started)", () => {
      expect(colors.mastery.level1).toBe("#ef5350");
    });

    it("level3 is green (proficient)", () => {
      expect(colors.mastery.level3).toBe("#4caf50");
    });

    it("level5 is purple (mastered)", () => {
      expect(colors.mastery.level5).toBe("#9c27b0");
    });

    it("all mastery colors are valid hex", () => {
      Object.values(colors.mastery).forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe("default export", () => {
    it("equals colors object", () => {
      expect(colorsDefault).toBe(colors);
    });
  });
});

describe("spacing constants", () => {
  it("has expected scale values", () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(20);
    expect(spacing.xxl).toBe(24);
  });

  it("values are in ascending order", () => {
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
    expect(spacing.lg).toBeLessThan(spacing.xl);
    expect(spacing.xl).toBeLessThan(spacing.xxl);
  });

  it("all values are positive numbers", () => {
    Object.values(spacing).forEach((value) => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
    });
  });

  it("values follow a reasonable scale", () => {
    // Each step roughly doubles or adds consistently
    expect(spacing.sm).toBe(spacing.xs * 2);
    expect(spacing.lg).toBe(spacing.sm * 2);
  });
});

describe("fontSizes constants", () => {
  it("has expected size values", () => {
    expect(fontSizes.xs).toBe(11);
    expect(fontSizes.sm).toBe(12);
    expect(fontSizes.md).toBe(13);
    expect(fontSizes.base).toBe(14);
    expect(fontSizes.lg).toBe(15);
    expect(fontSizes.xl).toBe(16);
    expect(fontSizes.xxl).toBe(18);
    expect(fontSizes.title).toBe(20);
    expect(fontSizes.header).toBe(22);
  });

  it("values are in ascending order", () => {
    expect(fontSizes.xs).toBeLessThan(fontSizes.sm);
    expect(fontSizes.sm).toBeLessThan(fontSizes.md);
    expect(fontSizes.md).toBeLessThan(fontSizes.base);
    expect(fontSizes.base).toBeLessThan(fontSizes.lg);
    expect(fontSizes.lg).toBeLessThan(fontSizes.xl);
    expect(fontSizes.xl).toBeLessThan(fontSizes.xxl);
    expect(fontSizes.xxl).toBeLessThan(fontSizes.title);
    expect(fontSizes.title).toBeLessThan(fontSizes.header);
  });

  it("all values are positive numbers", () => {
    Object.values(fontSizes).forEach((value) => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
    });
  });

  it("base size is reasonable for mobile", () => {
    expect(fontSizes.base).toBeGreaterThanOrEqual(12);
    expect(fontSizes.base).toBeLessThanOrEqual(18);
  });
});

describe("borderRadius constants", () => {
  it("has expected radius values", () => {
    expect(borderRadius.sm).toBe(4);
    expect(borderRadius.md).toBe(6);
    expect(borderRadius.lg).toBe(8);
    expect(borderRadius.xl).toBe(10);
    expect(borderRadius.round).toBe(16);
    expect(borderRadius.full).toBe(9999);
  });

  it("standard values are in ascending order", () => {
    expect(borderRadius.sm).toBeLessThan(borderRadius.md);
    expect(borderRadius.md).toBeLessThan(borderRadius.lg);
    expect(borderRadius.lg).toBeLessThan(borderRadius.xl);
    expect(borderRadius.xl).toBeLessThan(borderRadius.round);
    expect(borderRadius.round).toBeLessThan(borderRadius.full);
  });

  it("all values are non-negative numbers", () => {
    Object.values(borderRadius).forEach((value) => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  it("full radius creates circles", () => {
    expect(borderRadius.full).toBeGreaterThanOrEqual(9999);
  });
});

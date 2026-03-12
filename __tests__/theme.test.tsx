/**
 * Theme tests
 *
 * Tests for theme utilities including shadow creators.
 */
import { Platform } from "react-native";
import {
  shadows,
  createShadow,
  colors,
  spacing,
  fontSizes,
  borderRadius,
} from "../src/styles/theme";

describe("theme", () => {
  describe("exports", () => {
    it("exports colors from constants", () => {
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it("exports spacing from constants", () => {
      expect(spacing).toBeDefined();
      expect(typeof spacing.sm).toBe("number");
    });

    it("exports fontSizes from constants", () => {
      expect(fontSizes).toBeDefined();
      expect(typeof fontSizes.md).toBe("number");
    });

    it("exports borderRadius from constants", () => {
      expect(borderRadius).toBeDefined();
      expect(typeof borderRadius.sm).toBe("number");
    });
  });

  describe("shadows", () => {
    it("provides small shadow", () => {
      expect(shadows.small).toBeDefined();
    });

    it("provides medium shadow", () => {
      expect(shadows.medium).toBeDefined();
    });

    it("provides large shadow", () => {
      expect(shadows.large).toBeDefined();
    });

    it("small shadow has appropriate properties for native", () => {
      // Platform is mocked as "ios" in test environment
      const shadow = shadows.small;
      expect(shadow).toHaveProperty("shadowColor");
      expect(shadow).toHaveProperty("shadowOffset");
      expect(shadow).toHaveProperty("shadowOpacity");
      expect(shadow).toHaveProperty("shadowRadius");
    });
  });

  describe("createShadow", () => {
    describe("on native platforms", () => {
      it("creates shadow with default values", () => {
        const shadow = createShadow();

        expect(shadow.shadowColor).toBe("#000");
        expect(shadow.shadowOffset).toEqual({ width: 0, height: 4 });
        expect(shadow.shadowOpacity).toBe(0.2);
        expect(shadow.shadowRadius).toBe(8);
        expect(shadow.elevation).toBeDefined();
      });

      it("creates shadow with custom color", () => {
        const shadow = createShadow("#FF0000");
        expect(shadow.shadowColor).toBe("#FF0000");
      });

      it("creates shadow with custom offset", () => {
        const shadow = createShadow("#000", 2, 6);
        expect(shadow.shadowOffset).toEqual({ width: 2, height: 6 });
      });

      it("creates shadow with custom opacity", () => {
        const shadow = createShadow("#000", 0, 4, 0.5);
        expect(shadow.shadowOpacity).toBe(0.5);
      });

      it("creates shadow with custom radius", () => {
        const shadow = createShadow("#000", 0, 4, 0.2, 12);
        expect(shadow.shadowRadius).toBe(12);
      });

      it("calculates elevation from radius", () => {
        const shadow1 = createShadow("#000", 0, 4, 0.2, 8);
        expect(shadow1.elevation).toBe(4); // 8/2 = 4

        const shadow2 = createShadow("#000", 0, 4, 0.2, 16);
        expect(shadow2.elevation).toBe(8); // 16/2 = 8
      });

      it("ensures minimum elevation of 1", () => {
        const shadow = createShadow("#000", 0, 4, 0.2, 1);
        expect(shadow.elevation).toBeGreaterThanOrEqual(1);
      });
    });

    describe("on web platform", () => {
      const originalPlatform = Platform.OS;

      beforeEach(() => {
        // @ts-expect-error - testing platform mock
        Platform.OS = "web";
      });

      afterEach(() => {
        // @ts-expect-error - restore original
        Platform.OS = originalPlatform;
      });

      it("creates boxShadow CSS property", () => {
        const shadow = createShadow("#000000", 0, 4, 0.2, 8);

        expect(shadow.boxShadow).toBeDefined();
        expect(shadow.boxShadow).toContain("0px");
        expect(shadow.boxShadow).toContain("4px");
        expect(shadow.boxShadow).toContain("8px");
        expect(shadow.boxShadow).toContain("rgba(0, 0, 0, 0.2)");
      });

      it("converts hex color to rgba", () => {
        const shadow = createShadow("#FF0000", 0, 4, 0.5, 8);

        expect(shadow.boxShadow).toContain("rgba(255, 0, 0, 0.5)");
      });

      it("handles different hex colors", () => {
        const greenShadow = createShadow("#00FF00", 0, 4, 0.3, 8);
        expect(greenShadow.boxShadow).toContain("rgba(0, 255, 0, 0.3)");

        const blueShadow = createShadow("#0000FF", 0, 4, 0.3, 8);
        expect(blueShadow.boxShadow).toContain("rgba(0, 0, 255, 0.3)");
      });

      it("includes horizontal offset", () => {
        const shadow = createShadow("#000000", 5, 4, 0.2, 8);
        expect(shadow.boxShadow).toContain("5px");
      });
    });
  });
});

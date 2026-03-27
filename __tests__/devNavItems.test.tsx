/**
 * Tests for dev navigation items
 */
import { DEV_NAV_ITEMS } from "../src/constants/devNavItems";

interface DevNavItem {
  screen: string;
  label: string;
  icon: string;
}

describe("DEV_NAV_ITEMS", () => {
  describe("Array structure", () => {
    it("is an array of navigation items", () => {
      expect(Array.isArray(DEV_NAV_ITEMS)).toBe(true);
      expect(DEV_NAV_ITEMS.length).toBeGreaterThan(0);
    });

    it("has exactly 14 items", () => {
      expect(DEV_NAV_ITEMS.length).toBe(14);
    });

    it("is not empty", () => {
      expect(DEV_NAV_ITEMS.length).toBeGreaterThan(0);
    });
  });

  describe("Required screens", () => {
    it("contains Home screen", () => {
      const home = DEV_NAV_ITEMS.find((item) => item.screen === "Home");
      expect(home).toBeDefined();
      expect(home?.label).toBe("Home");
    });

    it("contains Practice setup", () => {
      const practice = DEV_NAV_ITEMS.find(
        (item) => item.screen === "StartPractice",
      );
      expect(practice).toBeDefined();
      expect(practice?.label).toBe("Practice Setup");
    });

    it("contains Admin console", () => {
      const admin = DEV_NAV_ITEMS.find((item) => item.screen === "Admin");
      expect(admin).toBeDefined();
      expect(admin?.label).toBe("Admin Console");
    });

    it("contains FirstNote screen", () => {
      const firstNote = DEV_NAV_ITEMS.find(
        (item) => item.screen === "FirstNote",
      );
      expect(firstNote).toBeDefined();
      expect(firstNote?.label).toBe("First Note (Day 0)");
    });

    it("contains SelfDirected screen", () => {
      const selfDirected = DEV_NAV_ITEMS.find(
        (item) => item.screen === "SelfDirected",
      );
      expect(selfDirected).toBeDefined();
      expect(selfDirected?.label).toBe("Self-Directed Mode");
    });

    it("contains TuneMastery screen", () => {
      const tuneMastery = DEV_NAV_ITEMS.find(
        (item) => item.screen === "TuneMastery",
      );
      expect(tuneMastery).toBeDefined();
      expect(tuneMastery?.label).toBe("Tune Mastery");
    });

    it("contains Composer screen", () => {
      const composer = DEV_NAV_ITEMS.find((item) => item.screen === "Composer");
      expect(composer).toBeDefined();
      expect(composer?.label).toBe("Practice Composer");
    });

    it("contains GenerationPreview screen", () => {
      const generationPreview = DEV_NAV_ITEMS.find(
        (item) => item.screen === "GenerationPreview",
      );
      expect(generationPreview).toBeDefined();
      expect(generationPreview?.label).toBe("Generation Preview");
    });

    it("contains TuneComposer screen", () => {
      const tuneComposer = DEV_NAV_ITEMS.find(
        (item) => item.screen === "TuneComposer",
      );
      expect(tuneComposer).toBeDefined();
      expect(tuneComposer?.label).toBe("Tune Composer");
    });

    it("contains ImportMusic screen", () => {
      const importMusic = DEV_NAV_ITEMS.find(
        (item) => item.screen === "ImportMusic",
      );
      expect(importMusic).toBeDefined();
      expect(importMusic?.label).toBe("Import Music");
    });

    it("contains MyScores screen", () => {
      const myScores = DEV_NAV_ITEMS.find((item) => item.screen === "MyScores");
      expect(myScores).toBeDefined();
      expect(myScores?.label).toBe("My Scores");
    });

    it("contains History screen", () => {
      const history = DEV_NAV_ITEMS.find((item) => item.screen === "History");
      expect(history).toBeDefined();
      expect(history?.label).toBe("Practice History");
    });

    it("contains ExerciseTest screen", () => {
      const exerciseTest = DEV_NAV_ITEMS.find(
        (item) => item.screen === "ExerciseTest",
      );
      expect(exerciseTest).toBeDefined();
      expect(exerciseTest?.label).toBe("Exercise Tester");
    });

    it("contains Onboarding screen", () => {
      const onboarding = DEV_NAV_ITEMS.find(
        (item) => item.screen === "Onboarding",
      );
      expect(onboarding).toBeDefined();
      expect(onboarding?.label).toBe("Onboarding");
    });
  });

  describe("Item properties", () => {
    it("all items have required properties", () => {
      DEV_NAV_ITEMS.forEach((item) => {
        expect(item).toHaveProperty("screen");
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("icon");
        expect(typeof item.screen).toBe("string");
        expect(typeof item.label).toBe("string");
      });
    });

    it("all screen names are non-empty strings", () => {
      DEV_NAV_ITEMS.forEach((item) => {
        expect(item.screen.length).toBeGreaterThan(0);
      });
    });

    it("all labels are non-empty strings", () => {
      DEV_NAV_ITEMS.forEach((item) => {
        expect(item.label.length).toBeGreaterThan(0);
      });
    });

    it("all icons are emoji strings", () => {
      DEV_NAV_ITEMS.forEach((item) => {
        expect(typeof item.icon).toBe("string");
        expect(item.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Uniqueness", () => {
    it("has unique screen names", () => {
      const screens = DEV_NAV_ITEMS.map((item) => item.screen);
      const uniqueScreens = [...new Set(screens)];
      expect(uniqueScreens.length).toBe(screens.length);
    });

    it("has unique labels", () => {
      const labels = DEV_NAV_ITEMS.map((item) => item.label);
      const uniqueLabels = [...new Set(labels)];
      expect(uniqueLabels.length).toBe(labels.length);
    });
  });

  describe("Expected screens", () => {
    it("contains expected screens", () => {
      const screenNames = DEV_NAV_ITEMS.map((item) => item.screen);
      expect(screenNames).toContain("FirstNote");
      expect(screenNames).toContain("SelfDirected");
      expect(screenNames).toContain("History");
      expect(screenNames).toContain("Onboarding");
    });

    it("contains all core screens", () => {
      const screenNames = DEV_NAV_ITEMS.map((item) => item.screen);
      expect(screenNames).toContain("Home");
      expect(screenNames).toContain("StartPractice");
      expect(screenNames).toContain("Admin");
    });

    it("contains practice-related screens", () => {
      const screenNames = DEV_NAV_ITEMS.map((item) => item.screen);
      expect(screenNames).toContain("TuneMastery");
      expect(screenNames).toContain("ExerciseTest");
    });
  });

  describe("Icons", () => {
    it("Home has house icon", () => {
      const home = DEV_NAV_ITEMS.find((item) => item.screen === "Home");
      expect(home?.icon).toBe("🏠");
    });

    it("StartPractice has target icon", () => {
      const practice = DEV_NAV_ITEMS.find(
        (item) => item.screen === "StartPractice",
      );
      expect(practice?.icon).toBe("🎯");
    });

    it("FirstNote has music note icon", () => {
      const firstNote = DEV_NAV_ITEMS.find(
        (item) => item.screen === "FirstNote",
      );
      expect(firstNote?.icon).toBe("🎵");
    });

    it("History has chart icon", () => {
      const history = DEV_NAV_ITEMS.find((item) => item.screen === "History");
      expect(history?.icon).toBe("📊");
    });

    it("ExerciseTest has test tube icon", () => {
      const exerciseTest = DEV_NAV_ITEMS.find(
        (item) => item.screen === "ExerciseTest",
      );
      expect(exerciseTest?.icon).toBe("🧪");
    });

    it("Admin has gear icon", () => {
      const admin = DEV_NAV_ITEMS.find((item) => item.screen === "Admin");
      expect(admin?.icon).toBe("⚙️");
    });

    it("Onboarding has wave icon", () => {
      const onboarding = DEV_NAV_ITEMS.find(
        (item) => item.screen === "Onboarding",
      );
      expect(onboarding?.icon).toBe("👋");
    });
  });

  describe("Order", () => {
    it("Home is first", () => {
      expect(DEV_NAV_ITEMS[0].screen).toBe("Home");
    });

    it("Admin is near the end", () => {
      const adminIndex = DEV_NAV_ITEMS.findIndex(
        (item) => item.screen === "Admin",
      );
      expect(adminIndex).toBeGreaterThan(5);
    });

    it("Onboarding is last", () => {
      expect(DEV_NAV_ITEMS[DEV_NAV_ITEMS.length - 1].screen).toBe("Onboarding");
    });
  });
});

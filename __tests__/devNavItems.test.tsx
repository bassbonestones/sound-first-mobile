/**
 * Tests for dev navigation items
 */
import { DEV_NAV_ITEMS } from "../src/constants/devNavItems";

describe("DEV_NAV_ITEMS", () => {
  it("is an array of navigation items", () => {
    expect(Array.isArray(DEV_NAV_ITEMS)).toBe(true);
    expect(DEV_NAV_ITEMS.length).toBeGreaterThan(0);
  });

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
  });

  it("contains Admin console", () => {
    const admin = DEV_NAV_ITEMS.find((item) => item.screen === "Admin");
    expect(admin).toBeDefined();
  });

  it("all items have required properties", () => {
    DEV_NAV_ITEMS.forEach((item) => {
      expect(item).toHaveProperty("screen");
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("icon");
      expect(typeof item.screen).toBe("string");
      expect(typeof item.label).toBe("string");
    });
  });

  it("has unique screen names", () => {
    const screens = DEV_NAV_ITEMS.map((item) => item.screen);
    const uniqueScreens = [...new Set(screens)];
    expect(uniqueScreens.length).toBe(screens.length);
  });

  it("all icons are emoji strings", () => {
    DEV_NAV_ITEMS.forEach((item) => {
      expect(typeof item.icon).toBe("string");
      expect(item.icon.length).toBeGreaterThan(0);
    });
  });

  it("contains expected screens", () => {
    const screenNames = DEV_NAV_ITEMS.map((item) => item.screen);
    expect(screenNames).toContain("FirstNote");
    expect(screenNames).toContain("SelfDirected");
    expect(screenNames).toContain("History");
    expect(screenNames).toContain("Onboarding");
  });
});

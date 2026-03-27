/**
 * Tests for RestLessonTypes
 */
import { getDefaultInstructions } from "../src/screens/Session/components/exercises/shared/RestLessonTypes";

describe("getDefaultInstructions", () => {
  describe("for quarter rest", () => {
    it("should return correct instructions for quarter rest", () => {
      const result = getDefaultInstructions("quarter", 1);

      expect(result.listen.title).toBe("Listen to the Pattern");
      expect(result.listen.instruction).toContain("Quarter Rest");
      expect(result.listen.instruction).toContain("1 beat");
    });

    it("should use singular 'beat' for 1 beat", () => {
      const result = getDefaultInstructions("quarter", 1);

      expect(result.listen.instruction).toContain("1 beat of silence");
    });
  });

  describe("for half rest", () => {
    it("should return correct instructions for half rest", () => {
      const result = getDefaultInstructions("half", 2);

      expect(result.listen.title).toBe("Listen to the Pattern");
      expect(result.listen.instruction).toContain("Half Rest");
      expect(result.listen.instruction).toContain("2 beats");
    });

    it("should use plural 'beats' for 2 beats", () => {
      const result = getDefaultInstructions("half", 2);

      expect(result.listen.instruction).toContain("2 beats of silence");
    });

    it("should provide correct sing phase instructions", () => {
      const result = getDefaultInstructions("half", 2);

      expect(result.sing.title).toBe("Sing Along");
      expect(result.sing.instruction).toContain(
        "STAY SILENT during the Half Rest",
      );
    });
  });

  describe("for whole rest", () => {
    it("should return correct instructions for whole rest", () => {
      const result = getDefaultInstructions("whole", 4);

      expect(result.listen.instruction).toContain("Whole Rest");
      expect(result.listen.instruction).toContain("4 beats");
    });

    it("should provide success result text", () => {
      const result = getDefaultInstructions("whole", 4);

      expect(result.sing.resultsSuccess).toContain("Whole Rest");
    });
  });

  describe("beat text pluralization", () => {
    it("should use 'beat' for 1 beat", () => {
      const result = getDefaultInstructions("quarter", 1);
      expect(result.listen.instruction).toMatch(/\b1 beat\b/);
    });

    it("should use 'beats' for multiple beats", () => {
      const result = getDefaultInstructions("whole", 4);
      expect(result.listen.instruction).toMatch(/\b4 beats\b/);
    });
  });
});

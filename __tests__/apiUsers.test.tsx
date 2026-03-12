/**
 * Tests for API users module
 */
import {
  getUser,
  getCapabilityProgress,
  getJourneyStage,
  getAllUsers,
  getFocusCards,
} from "../src/api/users";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("users API", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("getUser", () => {
    it("calls GET to user endpoint", async () => {
      const mockUser = { id: 1, email: "test@test.com" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await getUser(1);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/users/1");
      expect(result).toEqual(mockUser);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(getUser(999)).rejects.toThrow("Failed to fetch user");
    });
  });

  describe("getCapabilityProgress", () => {
    it("calls GET to capability-progress endpoint", async () => {
      const mockProgress = {
        user_id: 1,
        capabilities: [{ id: 1, name: "pitch", mastered: true }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      });

      const result = await getCapabilityProgress(1);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/users/1/capability-progress");
      expect(result).toEqual(mockProgress);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(getCapabilityProgress(1)).rejects.toThrow(
        "Failed to fetch progress",
      );
    });
  });

  describe("getJourneyStage", () => {
    it("calls GET to journey-stage endpoint", async () => {
      const mockStage = { stage: "explore", level: 2 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStage),
      });

      const result = await getJourneyStage(1);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/users/1/journey-stage");
      expect(result).toEqual(mockStage);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(getJourneyStage(1)).rejects.toThrow(
        "Failed to fetch journey stage",
      );
    });
  });

  describe("getAllUsers", () => {
    it("calls GET to admin users endpoint", async () => {
      const mockResponse = { users: [{ id: 1 }, { id: 2 }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getAllUsers();

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/admin/users");
      expect(result.users).toHaveLength(2);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(getAllUsers()).rejects.toThrow("Failed to fetch users");
    });
  });

  describe("getFocusCards", () => {
    it("calls GET to focus-cards endpoint", async () => {
      const mockCards = {
        focus_cards: [
          { id: 1, title: "Pitch" },
          { id: 2, title: "Rhythm" },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCards),
      });

      const result = await getFocusCards();

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/focus-cards");
      expect(result.focus_cards).toHaveLength(2);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(getFocusCards()).rejects.toThrow(
        "Failed to fetch focus cards",
      );
    });
  });
});

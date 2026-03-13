/**
 * Tests for EngineSettings admin component
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock fetch
global.fetch = jest.fn();

// Mock baseUrl
jest.mock("../../src/api/client", () => ({
  baseUrl: "http://test-api.com",
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devError: jest.fn(),
  devLog: jest.fn(),
  devWarn: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

import EngineSettings from "../../src/screens/Admin/tabs/EngineSettings/index.js";

describe("EngineSettings", () => {
  const mockConfig = {
    weights: {
      pitch: 1.0,
      rhythm: 0.8,
      reading: 0.5,
    },
    thresholds: {
      mastery: 0.8,
      review: 0.5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  describe("Loading State", () => {
    it("renders component", () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );

      const { UNSAFE_root } = render(<EngineSettings />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it("fetches config on mount", () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      render(<EngineSettings />);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("calls config endpoint", () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      render(<EngineSettings />);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-api.com/admin/engine/config",
      );
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles fetch error", () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { UNSAFE_root } = render(<EngineSettings />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it("handles non-ok response", () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const { UNSAFE_root } = render(<EngineSettings />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // ==========================================================================
  // BASIC RENDERING
  // ==========================================================================
  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      expect(() => render(<EngineSettings />)).not.toThrow();
    });

    it("renders with empty config", () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { UNSAFE_root } = render(<EngineSettings />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

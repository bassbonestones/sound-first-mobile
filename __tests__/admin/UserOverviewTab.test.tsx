import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock styles
jest.mock("../../src/screens/Admin/styles", () => ({
  __esModule: true,
  default: {
    detailSection: {},
    detailSectionTitle: {},
    detailLabel: {},
  },
}));

jest.mock(
  "../../src/screens/Admin/tabs/UserProgressionInspector/styles",
  () => ({
    localStyles: {
      actionBar: {},
      editButton: {},
      editButtonText: {},
      resetButton: {},
      resetButtonText: {},
      saveButton: {},
      saveButtonText: {},
      cancelButton: {},
      cancelButtonText: {},
      dropdownRow: {},
      instrumentButton: {},
      instrumentButtonText: {},
      instrumentArrow: {},
      toggleRow: {},
      toggleButton: {},
      toggleActive: {},
      toggleText: {},
      stageButtons: {},
      stageButton: {},
      stageButtonActive: {},
      stageButtonText: {},
      stageButtonTextActive: {},
      modalOverlay: {},
      modalContent: {},
      modalTitle: {},
      modalScroll: {},
      instrumentOption: {},
      instrumentOptionSelected: {},
      instrumentOptionText: {},
      instrumentOptionTextSelected: {},
      instrumentClef: {},
      modalCloseButton: {},
      modalCloseText: {},
    },
  }),
);

// Mock showAlert to capture alert calls
const mockShowAlert = jest.fn();
jest.mock(
  "../../src/screens/Admin/tabs/UserProgressionInspector/utils",
  () => ({
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
);

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

import { UserOverviewTab } from "../../src/screens/Admin/tabs/UserProgressionInspector/UserOverviewTab";

describe("UserOverviewTab", () => {
  const mockUserData = {
    user: {
      id: 123,
      email: "test@example.com",
      instrument: "Trombone",
      resonant_note: "F3",
      range_low: "Bb2",
      range_high: "F5",
      day0_completed: true,
      day0_stage: 3,
    },
    journey: {
      stage: "foundations",
      capabilities_mastered: 15,
      materials_completed: 42,
    },
  };

  const defaultProps = {
    userData: mockUserData,
    userId: "user-123",
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("rendering", () => {
    it("displays user info", () => {
      render(<UserOverviewTab {...defaultProps} />);

      expect(screen.getByText("User Info")).toBeTruthy();
      expect(screen.getByText("123")).toBeTruthy();
      expect(screen.getByText("test@example.com")).toBeTruthy();
      expect(screen.getByText("Trombone")).toBeTruthy();
      expect(screen.getByText("F3")).toBeTruthy();
      expect(screen.getByText("Bb2 - F5")).toBeTruthy();
    });

    it("displays journey info", () => {
      render(<UserOverviewTab {...defaultProps} />);

      expect(screen.getByText("Journey Stage")).toBeTruthy();
      expect(screen.getByText("foundations")).toBeTruthy();
      expect(screen.getByText("15")).toBeTruthy();
      expect(screen.getByText("42")).toBeTruthy();
    });

    it("displays N/A for missing user data", () => {
      render(
        <UserOverviewTab
          {...defaultProps}
          userData={{ user: {}, journey: {} }}
        />,
      );

      expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
    });

    it("shows Edit User Info and Reset User buttons", () => {
      render(<UserOverviewTab {...defaultProps} />);

      expect(screen.getByLabelText("Edit user info")).toBeTruthy();
      expect(screen.getByLabelText("Reset user progress")).toBeTruthy();
    });
  });

  describe("edit mode", () => {
    it("enters edit mode when Edit button is pressed", () => {
      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));

      expect(screen.getByLabelText("Save changes")).toBeTruthy();
      expect(screen.getByLabelText("Cancel editing")).toBeTruthy();
    });

    it("exits edit mode when Cancel is pressed", () => {
      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Cancel editing"));

      expect(screen.getByLabelText("Edit user info")).toBeTruthy();
    });

    it("populates edit values with current user data", () => {
      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));

      // Should show current instrument in button text
      expect(screen.getByText("Trombone")).toBeTruthy();
    });

    it("toggles day0_completed", () => {
      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));

      // Find the toggle button and toggle it
      const toggleButtons = screen.getAllByText("Yes");
      fireEvent.press(toggleButtons[0]);

      expect(screen.getByText("No")).toBeTruthy();
    });
  });

  describe("validation", () => {
    it("requires instrument when day0_completed is true", async () => {
      render(
        <UserOverviewTab
          {...defaultProps}
          userData={{
            user: { ...mockUserData.user, instrument: "" },
            journey: mockUserData.journey,
          }}
        />,
      );

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Validation Error",
          "Instrument is required when Day 0 is complete",
        );
      });
    });

    it("requires resonant_note when day0_completed is true", async () => {
      render(
        <UserOverviewTab
          {...defaultProps}
          userData={{
            user: { ...mockUserData.user, resonant_note: "" },
            journey: mockUserData.journey,
          }}
        />,
      );

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Validation Error",
          "Resonant note is required when Day 0 is complete",
        );
      });
    });

    it("requires range_low when day0_completed is true", async () => {
      render(
        <UserOverviewTab
          {...defaultProps}
          userData={{
            user: { ...mockUserData.user, range_low: "" },
            journey: mockUserData.journey,
          }}
        />,
      );

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Validation Error",
          "Range low is required when Day 0 is complete",
        );
      });
    });

    it("requires range_high when day0_completed is true", async () => {
      render(
        <UserOverviewTab
          {...defaultProps}
          userData={{
            user: { ...mockUserData.user, range_high: "" },
            journey: mockUserData.journey,
          }}
        />,
      );

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Validation Error",
          "Range high is required when Day 0 is complete",
        );
      });
    });
  });

  describe("save changes", () => {
    it("saves changes successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Success",
          "User info updated",
        );
      });
    });

    it("handles save failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Error",
          "Failed to update user info",
        );
      });
    });

    it("grants day0 capabilities when completing day0", async () => {
      const userData = {
        user: { ...mockUserData.user, day0_completed: false },
        journey: mockUserData.journey,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ granted: ["cap1", "cap2"] }),
        });

      render(<UserOverviewTab {...defaultProps} userData={userData} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));
      // Toggle day0_completed to true
      const toggleButton = screen.getByText("No");
      fireEvent.press(toggleButton);
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Success",
          expect.stringContaining("Day 0 capabilities granted"),
        );
      });
    });

    it("handles network error on save", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByLabelText("Save changes"));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Error",
          "Failed to save changes",
        );
      });
    });
  });

  describe("reset user", () => {
    it("shows confirmation dialog on reset", () => {
      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Reset user progress"));

      expect(mockShowAlert).toHaveBeenCalledWith(
        "Reset User",
        expect.stringContaining("DELETE all user progress"),
        expect.any(Array),
      );
    });

    it("calls reset API when confirmed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deleted_counts: { capabilities: 10 } }),
      });

      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Reset user progress"));

      // Get the onPress handler from the confirmation array
      const alertCall = mockShowAlert.mock.calls[0];
      const buttons = alertCall[2];
      const resetButton = buttons.find(
        (b: { text: string }) => b.text === "Reset",
      );

      if (resetButton?.onPress) {
        await resetButton.onPress();
      }

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/admin/users/user-123/reset"),
          { method: "POST" },
        );
        expect(defaultProps.onRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("instrument picker modal", () => {
    it("opens instrument picker modal", () => {
      render(<UserOverviewTab {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Edit user info"));
      fireEvent.press(screen.getByText("Trombone"));

      expect(screen.getByText("Select Instrument")).toBeTruthy();
    });
  });
});

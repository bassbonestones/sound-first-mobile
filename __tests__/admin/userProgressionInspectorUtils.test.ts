/**
 * Tests for UserProgressionInspector utils
 */
import { Platform, Alert } from "react-native";
import { showAlert } from "../../src/screens/Admin/tabs/UserProgressionInspector/utils";

describe("showAlert", () => {
  // Store original Platform.OS
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform.OS before each test
    (Platform as any).OS = originalPlatformOS;
  });

  afterAll(() => {
    // Restore original Platform.OS
    (Platform as any).OS = originalPlatformOS;
  });

  describe("on native platforms", () => {
    beforeEach(() => {
      (Platform as any).OS = "ios";
    });

    it("should call Alert.alert with title and message", () => {
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();

      showAlert("Test Title", "Test message");

      expect(alertSpy).toHaveBeenCalledWith(
        "Test Title",
        "Test message",
        undefined,
      );

      alertSpy.mockRestore();
    });

    it("should call Alert.alert with buttons", () => {
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
      const buttons = [
        { text: "Cancel", style: "cancel" as const },
        { text: "OK", style: "default" as const },
      ];

      showAlert("Title", "Message", buttons);

      expect(alertSpy).toHaveBeenCalledWith("Title", "Message", buttons);

      alertSpy.mockRestore();
    });

    it("should call Alert.alert with destructive button", () => {
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
      const onPress = jest.fn();
      const buttons = [
        { text: "Cancel", style: "cancel" as const },
        { text: "Delete", style: "destructive" as const, onPress },
      ];

      showAlert("Confirm Delete", "Are you sure?", buttons);

      expect(alertSpy).toHaveBeenCalledWith(
        "Confirm Delete",
        "Are you sure?",
        buttons,
      );

      alertSpy.mockRestore();
    });
  });

  describe("on web platform", () => {
    const mockConfirm = jest.fn();
    const mockAlert = jest.fn();

    beforeEach(() => {
      (Platform as any).OS = "web";
      (global as any).window = {
        confirm: mockConfirm,
        alert: mockAlert,
      };
      mockConfirm.mockClear();
      mockAlert.mockClear();
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it("should call window.alert for simple messages", () => {
      showAlert("Info", "This is information");

      expect(mockAlert).toHaveBeenCalledWith("Info\n\nThis is information");
    });

    it("should call window.confirm for destructive actions with cancel", () => {
      const onDestructive = jest.fn();
      mockConfirm.mockReturnValue(true);

      showAlert("Delete Item", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDestructive },
      ]);

      expect(mockConfirm).toHaveBeenCalledWith("Delete Item\n\nAre you sure?");
      expect(onDestructive).toHaveBeenCalled();
    });

    it("should not call onPress when confirm is cancelled", () => {
      const onDestructive = jest.fn();
      mockConfirm.mockReturnValue(false);

      showAlert("Delete Item", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDestructive },
      ]);

      expect(mockConfirm).toHaveBeenCalled();
      expect(onDestructive).not.toHaveBeenCalled();
    });

    it("should fall back to window.alert when only destructive button", () => {
      showAlert("Warning", "This action cannot be undone", [
        { text: "Delete", style: "destructive" },
      ]);

      expect(mockAlert).toHaveBeenCalledWith(
        "Warning\n\nThis action cannot be undone",
      );
    });

    it("should fall back to window.alert when only cancel button", () => {
      showAlert("Info", "Acknowledged", [{ text: "OK", style: "cancel" }]);

      expect(mockAlert).toHaveBeenCalledWith("Info\n\nAcknowledged");
    });
  });
});

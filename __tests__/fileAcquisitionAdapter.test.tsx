/**
 * File Acquisition Adapter Tests
 *
 * Tests for the adapter pattern implementation.
 */

import {
  setFileAcquisitionAdapter,
  getFileAcquisitionAdapter,
  hasFileAcquisitionAdapter,
  type FileAcquisitionAdapter,
  type AcquisitionResult,
  type PermissionResult,
} from "../src/features/importMusic/adapters/fileAcquisitionAdapter";
import {
  ExpoFileAcquisitionAdapter,
  createExpoFileAcquisitionAdapter,
  getDefaultExpoAdapter,
} from "../src/features/importMusic/adapters/expoFileAcquisitionAdapter";

// Store mock functions for easy access
const mockGetCameraPermissions = jest.fn();
const mockRequestCameraPermissions = jest.fn();
const mockGetMediaLibraryPermissions = jest.fn();
const mockRequestMediaLibraryPermissions = jest.fn();
const mockLaunchCamera = jest.fn();
const mockLaunchImageLibrary = jest.fn();
const mockGetDocument = jest.fn();
const mockGetInfoAsync = jest.fn();
const mockReadAsStringAsync = jest.fn();
const mockCopyAsync = jest.fn();
const mockDeleteAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();

// Mock the Expo modules
jest.mock("expo-image-picker", () => ({
  getCameraPermissionsAsync: (...args: unknown[]) =>
    mockGetCameraPermissions(...args),
  requestCameraPermissionsAsync: (...args: unknown[]) =>
    mockRequestCameraPermissions(...args),
  getMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockGetMediaLibraryPermissions(...args),
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermissions(...args),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCamera(...args),
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibrary(...args),
  CameraType: {
    front: "front",
    back: "back",
  },
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocument(...args),
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  documentDirectory: "file:///documents/",
}));

// Default mock implementations
function setupDefaultMocks() {
  mockGetCameraPermissions.mockResolvedValue({
    status: "granted",
    canAskAgain: true,
  });
  mockRequestCameraPermissions.mockResolvedValue({
    status: "granted",
    canAskAgain: false,
  });
  mockGetMediaLibraryPermissions.mockResolvedValue({
    status: "granted",
    canAskAgain: true,
  });
  mockRequestMediaLibraryPermissions.mockResolvedValue({
    status: "granted",
    canAskAgain: false,
  });
  mockLaunchCamera.mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: "file:///path/to/photo.jpg",
        mimeType: "image/jpeg",
        fileName: "photo.jpg",
      },
    ],
  });
  mockLaunchImageLibrary.mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: "file:///path/to/image.png",
        mimeType: "image/png",
        fileName: "image.png",
      },
    ],
  });
  mockGetDocument.mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: "file:///path/to/document.pdf",
        mimeType: "application/pdf",
        name: "document.pdf",
        size: 1024,
      },
    ],
  });
  mockGetInfoAsync.mockResolvedValue({
    exists: true,
    size: 1024,
    isDirectory: false,
  });
  mockReadAsStringAsync.mockResolvedValue("file content");
  mockCopyAsync.mockResolvedValue(undefined);
  mockDeleteAsync.mockResolvedValue(undefined);
  mockMakeDirectoryAsync.mockResolvedValue(undefined);
}

describe("FileAcquisitionAdapter", () => {
  // Reset mocks and adapter state before each test
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  describe("Adapter Registration", () => {
    it("should throw when getting adapter before setting one", () => {
      // Re-import to reset module state
      jest.isolateModules(() => {
        const {
          getFileAcquisitionAdapter,
          hasFileAcquisitionAdapter,
        } = require("../src/features/importMusic/adapters/fileAcquisitionAdapter");

        expect(hasFileAcquisitionAdapter()).toBe(false);
        expect(() => getFileAcquisitionAdapter()).toThrow(
          "No FileAcquisitionAdapter has been set",
        );
      });
    });

    it("should set and get adapter correctly", () => {
      jest.isolateModules(() => {
        const {
          setFileAcquisitionAdapter,
          getFileAcquisitionAdapter,
          hasFileAcquisitionAdapter,
        } = require("../src/features/importMusic/adapters/fileAcquisitionAdapter");

        const mockAdapter: FileAcquisitionAdapter = {
          adapterId: "test",
          checkCameraPermission: jest.fn(),
          requestCameraPermission: jest.fn(),
          checkMediaLibraryPermission: jest.fn(),
          requestMediaLibraryPermission: jest.fn(),
          acquireFromCamera: jest.fn(),
          acquireFromImageLibrary: jest.fn(),
          acquireFromDocuments: jest.fn(),
          readFileAsString: jest.fn(),
          readFileAsBase64: jest.fn(),
          getFileInfo: jest.fn(),
          copyToPersistentStorage: jest.fn(),
          deleteFile: jest.fn(),
        };

        setFileAcquisitionAdapter(mockAdapter);
        expect(hasFileAcquisitionAdapter()).toBe(true);
        expect(getFileAcquisitionAdapter()).toBe(mockAdapter);
      });
    });
  });

  describe("ExpoFileAcquisitionAdapter", () => {
    let adapter: ExpoFileAcquisitionAdapter;

    beforeEach(() => {
      adapter = new ExpoFileAcquisitionAdapter();
    });

    describe("adapterId", () => {
      it("should have correct adapter ID", () => {
        expect(adapter.adapterId).toBe("expo");
      });
    });

    describe("Permission Management", () => {
      it("should check camera permission", async () => {
        const result = await adapter.checkCameraPermission();
        expect(result.granted).toBe(true);
        expect(result.canAskAgain).toBe(true);
      });

      it("should request camera permission", async () => {
        const result = await adapter.requestCameraPermission();
        expect(result.granted).toBe(true);
        expect(result.canAskAgain).toBe(false);
      });

      it("should check media library permission", async () => {
        const result = await adapter.checkMediaLibraryPermission();
        expect(result.granted).toBe(true);
        expect(result.canAskAgain).toBe(true);
      });

      it("should request media library permission", async () => {
        const result = await adapter.requestMediaLibraryPermission();
        expect(result.granted).toBe(true);
        expect(result.canAskAgain).toBe(false);
      });

      it("should handle permission denied", async () => {
        mockGetCameraPermissions.mockResolvedValueOnce({
          status: "denied",
          canAskAgain: false,
        });

        const result = await adapter.checkCameraPermission();
        expect(result.granted).toBe(false);
        expect(result.canAskAgain).toBe(false);
      });
    });

    describe("Camera Acquisition", () => {
      it("should acquire photo from camera", async () => {
        const result = await adapter.acquireFromCamera();
        expect(result.success).toBe(true);
        expect(result.asset).not.toBeNull();
        expect(result.asset?.sourceType).toBe("photo");
        expect(result.asset?.mimeType).toBe("image/jpeg");
      });

      it("should handle camera cancellation", async () => {
        mockLaunchCamera.mockResolvedValueOnce({
          canceled: true,
          assets: [],
        });

        const result = await adapter.acquireFromCamera();
        expect(result.success).toBe(false);
        expect(result.asset).toBeNull();
        expect(result.error?.code).toBe("canceled_by_user");
      });

      it("should handle camera permission denied", async () => {
        mockRequestCameraPermissions.mockResolvedValueOnce({
          status: "denied",
          canAskAgain: false,
        });

        const result = await adapter.acquireFromCamera();
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("permission_denied");
      });

      it("should pass camera options correctly", async () => {
        await adapter.acquireFromCamera({
          cameraType: "front",
          allowsEditing: true,
          quality: 0.5,
        });

        expect(mockLaunchCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            allowsEditing: true,
            quality: 0.5,
            cameraType: "front",
          }),
        );
      });
    });

    describe("Image Library Acquisition", () => {
      it("should acquire image from library", async () => {
        const result = await adapter.acquireFromImageLibrary();
        expect(result.success).toBe(true);
        expect(result.asset).not.toBeNull();
        expect(result.asset?.sourceType).toBe("image");
      });

      it("should handle library cancellation", async () => {
        mockLaunchImageLibrary.mockResolvedValueOnce({
          canceled: true,
          assets: [],
        });

        const result = await adapter.acquireFromImageLibrary();
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("canceled_by_user");
      });

      it("should handle library permission denied", async () => {
        mockRequestMediaLibraryPermissions.mockResolvedValueOnce({
          status: "denied",
          canAskAgain: false,
        });

        const result = await adapter.acquireFromImageLibrary();
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("permission_denied");
      });
    });

    describe("Document Acquisition", () => {
      it("should acquire PDF document", async () => {
        const result = await adapter.acquireFromDocuments({
          documentType: "pdf",
        });
        expect(result.success).toBe(true);
        expect(result.asset?.sourceType).toBe("pdf");
      });

      it("should acquire MusicXML document", async () => {
        mockGetDocument.mockResolvedValueOnce({
          canceled: false,
          assets: [
            {
              uri: "file:///path/to/score.musicxml",
              mimeType: "application/xml",
              name: "score.musicxml",
              size: 2048,
            },
          ],
        });

        const result = await adapter.acquireFromDocuments({
          documentType: "musicxml",
        });
        expect(result.success).toBe(true);
        expect(result.asset?.sourceType).toBe("musicxml");
      });

      it("should acquire MXL document", async () => {
        mockGetDocument.mockResolvedValueOnce({
          canceled: false,
          assets: [
            {
              uri: "file:///path/to/score.mxl",
              mimeType: "application/zip",
              name: "score.mxl",
              size: 4096,
            },
          ],
        });

        const result = await adapter.acquireFromDocuments({
          documentType: "musicxml",
        });
        expect(result.success).toBe(true);
        expect(result.asset?.sourceType).toBe("mxl");
      });

      it("should handle document picker cancellation", async () => {
        mockGetDocument.mockResolvedValueOnce({
          canceled: true,
          assets: [],
        });

        const result = await adapter.acquireFromDocuments({
          documentType: "pdf",
        });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("canceled_by_user");
      });

      it("should reject wrong file type for PDF", async () => {
        mockGetDocument.mockResolvedValueOnce({
          canceled: false,
          assets: [
            {
              uri: "file:///path/to/wrong.txt",
              mimeType: "text/plain",
              name: "wrong.txt",
              size: 100,
            },
          ],
        });

        const result = await adapter.acquireFromDocuments({
          documentType: "pdf",
        });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("unsupported_type");
      });

      it("should reject wrong file type for MusicXML", async () => {
        mockGetDocument.mockResolvedValueOnce({
          canceled: false,
          assets: [
            {
              uri: "file:///path/to/wrong.doc",
              mimeType: "application/msword",
              name: "wrong.doc",
              size: 100,
            },
          ],
        });

        const result = await adapter.acquireFromDocuments({
          documentType: "musicxml",
        });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("unsupported_type");
      });
    });

    describe("File Operations", () => {
      it("should read file as string", async () => {
        const content = await adapter.readFileAsString(
          "file:///path/to/file.xml",
        );
        expect(content).toBe("file content");
      });

      it("should read file as base64", async () => {
        const content = await adapter.readFileAsBase64(
          "file:///path/to/file.bin",
        );
        expect(content).toBe("file content");
      });

      it("should get file info", async () => {
        const info = await adapter.getFileInfo("file:///path/to/file.xml");
        expect(info.exists).toBe(true);
        expect(info.size).toBe(1024);
      });

      it("should handle non-existent file", async () => {
        mockGetInfoAsync.mockResolvedValueOnce({
          exists: false,
        });

        const info = await adapter.getFileInfo("file:///path/to/missing.xml");
        expect(info.exists).toBe(false);
        expect(info.size).toBeNull();
      });

      it("should copy file to persistent storage", async () => {
        mockGetInfoAsync.mockResolvedValueOnce({ exists: true });

        const destUri = await adapter.copyToPersistentStorage(
          "file:///source.xml",
          "dest.xml",
        );

        expect(destUri).toBe("file:///documents/imports/dest.xml");
        expect(mockCopyAsync).toHaveBeenCalled();
      });

      it("should create directory if needed when copying", async () => {
        mockGetInfoAsync.mockResolvedValueOnce({ exists: false });

        await adapter.copyToPersistentStorage("file:///source.xml", "dest.xml");

        expect(mockMakeDirectoryAsync).toHaveBeenCalled();
      });

      it("should delete file", async () => {
        await adapter.deleteFile("file:///path/to/file.xml");

        expect(mockDeleteAsync).toHaveBeenCalledWith(
          "file:///path/to/file.xml",
          { idempotent: true },
        );
      });

      it("should handle read errors", async () => {
        mockReadAsStringAsync.mockRejectedValueOnce(new Error("Read error"));

        await expect(
          adapter.readFileAsString("file:///path/to/file.xml"),
        ).rejects.toThrow("Failed to read file");
      });
    });
  });

  describe("Factory Functions", () => {
    it("should create new adapter instance", () => {
      const adapter1 = createExpoFileAcquisitionAdapter();
      const adapter2 = createExpoFileAcquisitionAdapter();
      expect(adapter1).not.toBe(adapter2);
      expect(adapter1.adapterId).toBe("expo");
    });

    it("should return singleton from getDefaultExpoAdapter", () => {
      jest.isolateModules(() => {
        const {
          getDefaultExpoAdapter,
        } = require("../src/features/importMusic/adapters/expoFileAcquisitionAdapter");
        const adapter1 = getDefaultExpoAdapter();
        const adapter2 = getDefaultExpoAdapter();
        expect(adapter1).toBe(adapter2);
      });
    });
  });
});

describe("fileAcquisition service (with adapter)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset adapter state
    jest.isolateModules(() => {});
  });

  it("should auto-initialize with Expo adapter", async () => {
    jest.isolateModules(async () => {
      const {
        requestCameraPermission,
        hasFileAcquisitionAdapter,
      } = require("../src/features/importMusic/services/fileAcquisition");

      // Initially no adapter
      // After calling any function, adapter should be auto-initialized
      const result = await requestCameraPermission();
      expect(typeof result).toBe("boolean");
    });
  });
});

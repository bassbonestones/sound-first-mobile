/**
 * Tests for devLogger utility
 * Verifies dev-only logging behavior
 */
import {
  devLog,
  devWarn,
  devError,
  createDevLogger,
} from "../src/utils/devLogger";
import devLoggerDefault from "../src/utils/devLogger";

describe("devLogger", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("devLog", () => {
    it("logs messages in dev mode", () => {
      devLog("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("test message");
    });

    it("logs multiple arguments", () => {
      devLog("message", 1, { key: "value" });
      expect(consoleLogSpy).toHaveBeenCalledWith("message", 1, {
        key: "value",
      });
    });

    it("handles no arguments", () => {
      devLog();
      expect(consoleLogSpy).toHaveBeenCalledWith();
    });
  });

  describe("devWarn", () => {
    it("warns in dev mode", () => {
      devWarn("warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("warning message");
    });

    it("warns with multiple arguments", () => {
      devWarn("warning", "extra", 123);
      expect(consoleWarnSpy).toHaveBeenCalledWith("warning", "extra", 123);
    });
  });

  describe("devError", () => {
    it("logs errors in dev mode", () => {
      devError("error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("error message");
    });

    it("logs error objects", () => {
      const error = new Error("test error");
      devError("Error:", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
    });
  });

  describe("createDevLogger", () => {
    it("creates a prefixed logger", () => {
      const logger = createDevLogger("TestModule");
      expect(logger).toHaveProperty("log");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("error");
    });

    it("prefixes log messages", () => {
      const logger = createDevLogger("MyModule");
      logger.log("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("[MyModule]", "test message");
    });

    it("prefixes warn messages", () => {
      const logger = createDevLogger("MyModule");
      logger.warn("warning");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[MyModule]", "warning");
    });

    it("prefixes error messages", () => {
      const logger = createDevLogger("MyModule");
      logger.error("error");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[MyModule]", "error");
    });

    it("handles complex prefix names", () => {
      const logger = createDevLogger("Component:SubComponent");
      logger.log("message");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Component:SubComponent]",
        "message",
      );
    });

    it("logs multiple arguments with prefix", () => {
      const logger = createDevLogger("Test");
      logger.log("arg1", "arg2", 123);
      expect(consoleLogSpy).toHaveBeenCalledWith("[Test]", "arg1", "arg2", 123);
    });
  });

  describe("default export", () => {
    it("has log method", () => {
      expect(typeof devLoggerDefault.log).toBe("function");
    });

    it("has warn method", () => {
      expect(typeof devLoggerDefault.warn).toBe("function");
    });

    it("has error method", () => {
      expect(typeof devLoggerDefault.error).toBe("function");
    });

    it("has createLogger method", () => {
      expect(typeof devLoggerDefault.createLogger).toBe("function");
    });

    it("default log works", () => {
      devLoggerDefault.log("default log");
      expect(consoleLogSpy).toHaveBeenCalledWith("default log");
    });

    it("default createLogger works", () => {
      const logger = devLoggerDefault.createLogger("DefaultTest");
      logger.log("message");
      expect(consoleLogSpy).toHaveBeenCalledWith("[DefaultTest]", "message");
    });
  });
});

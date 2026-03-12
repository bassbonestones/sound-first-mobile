/**
 * Tests for API constants
 */
import {
  API_CONFIG,
  ENDPOINTS,
  HTTP_STATUS,
  CONTENT_TYPE,
} from "../src/constants/api";
import apiDefaults from "../src/constants/api";

describe("API_CONFIG", () => {
  it("has reasonable timeout", () => {
    expect(API_CONFIG.timeout).toBe(10000);
    expect(API_CONFIG.timeout).toBeGreaterThanOrEqual(5000);
  });

  it("has retry configuration", () => {
    expect(API_CONFIG.retryAttempts).toBe(3);
    expect(API_CONFIG.retryDelay).toBe(1000);
  });

  it("retry attempts is reasonable", () => {
    expect(API_CONFIG.retryAttempts).toBeGreaterThanOrEqual(1);
    expect(API_CONFIG.retryAttempts).toBeLessThanOrEqual(10);
  });
});

describe("ENDPOINTS", () => {
  describe("auth endpoints", () => {
    it("has login endpoint", () => {
      expect(ENDPOINTS.login).toBe("/auth/login");
    });

    it("has register endpoint", () => {
      expect(ENDPOINTS.register).toBe("/auth/register");
    });
  });

  describe("user endpoints", () => {
    it("has user endpoint", () => {
      expect(ENDPOINTS.user).toBe("/user");
    });

    it("has user instruments endpoint", () => {
      expect(ENDPOINTS.userInstruments).toBe("/user/instruments");
    });

    it("has user progress endpoint", () => {
      expect(ENDPOINTS.userProgress).toBe("/user/progress");
    });
  });

  describe("practice endpoints", () => {
    it("has practice attempt endpoint", () => {
      expect(ENDPOINTS.practiceAttempt).toBe("/practice-attempt");
    });

    it("has practice session endpoint", () => {
      expect(ENDPOINTS.practiceSession).toBe("/practice-sessions");
    });

    it("has generate session endpoint", () => {
      expect(ENDPOINTS.generateSession).toBe("/generate-session");
    });
  });

  describe("materials endpoints", () => {
    it("has materials endpoint", () => {
      expect(ENDPOINTS.materials).toBe("/materials");
    });

    it("has materialById function", () => {
      expect(typeof ENDPOINTS.materialById).toBe("function");
      expect(ENDPOINTS.materialById(123)).toBe("/materials/123");
      expect(ENDPOINTS.materialById("abc")).toBe("/materials/abc");
    });
  });

  describe("focus cards endpoints", () => {
    it("has focus cards endpoint", () => {
      expect(ENDPOINTS.focusCards).toBe("/focus-cards");
    });

    it("has focusCardById function", () => {
      expect(typeof ENDPOINTS.focusCardById).toBe("function");
      expect(ENDPOINTS.focusCardById(5)).toBe("/focus-cards/5");
    });
  });

  describe("capabilities endpoints", () => {
    it("has capabilities endpoint", () => {
      expect(ENDPOINTS.capabilities).toBe("/capabilities");
    });

    it("has capabilityById function", () => {
      expect(ENDPOINTS.capabilityById(10)).toBe("/capabilities/10");
    });

    it("has capability domains endpoint", () => {
      expect(ENDPOINTS.capabilityDomains).toBe("/capabilities/domains");
    });
  });

  describe("history endpoints", () => {
    it("has history summary endpoint", () => {
      expect(ENDPOINTS.historySummary).toBe("/history/summary");
    });

    it("has history materials endpoint", () => {
      expect(ENDPOINTS.historyMaterials).toBe("/history/materials");
    });

    it("has history focus cards endpoint", () => {
      expect(ENDPOINTS.historyFocusCards).toBe("/history/focus-cards");
    });

    it("has history timeline endpoint", () => {
      expect(ENDPOINTS.historyTimeline).toBe("/history/timeline");
    });
  });

  describe("admin endpoints", () => {
    it("has soft gates endpoint", () => {
      expect(ENDPOINTS.softGates).toBe("/soft-gates");
    });

    it("has soft gate rules endpoint", () => {
      expect(ENDPOINTS.softGateRules).toBe("/soft-gate-rules");
    });

    it("has user soft gate state endpoint", () => {
      expect(ENDPOINTS.userSoftGateState).toBe("/user-soft-gate-state");
    });
  });

  describe("all endpoints start with /", () => {
    it("string endpoints start with /", () => {
      Object.entries(ENDPOINTS).forEach(([key, value]) => {
        if (typeof value === "string") {
          expect(value.startsWith("/")).toBe(true);
        }
      });
    });

    it("function endpoints return paths starting with /", () => {
      expect(ENDPOINTS.materialById(1).startsWith("/")).toBe(true);
      expect(ENDPOINTS.focusCardById(1).startsWith("/")).toBe(true);
      expect(ENDPOINTS.capabilityById(1).startsWith("/")).toBe(true);
    });
  });
});

describe("HTTP_STATUS", () => {
  it("has success status codes", () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
  });

  it("has client error status codes", () => {
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
  });

  it("has server error status code", () => {
    expect(HTTP_STATUS.SERVER_ERROR).toBe(500);
  });

  it("all values are numbers", () => {
    Object.values(HTTP_STATUS).forEach((code) => {
      expect(typeof code).toBe("number");
    });
  });
});

describe("CONTENT_TYPE", () => {
  it("has JSON content type", () => {
    expect(CONTENT_TYPE.JSON).toBe("application/json");
  });

  it("has form content type", () => {
    expect(CONTENT_TYPE.FORM).toBe("application/x-www-form-urlencoded");
  });

  it("has multipart content type", () => {
    expect(CONTENT_TYPE.MULTIPART).toBe("multipart/form-data");
  });
});

describe("default export", () => {
  it("contains all exports", () => {
    expect(apiDefaults.API_CONFIG).toBe(API_CONFIG);
    expect(apiDefaults.ENDPOINTS).toBe(ENDPOINTS);
    expect(apiDefaults.HTTP_STATUS).toBe(HTTP_STATUS);
    expect(apiDefaults.CONTENT_TYPE).toBe(CONTENT_TYPE);
  });
});

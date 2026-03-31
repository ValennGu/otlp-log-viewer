import { describe, it, expect } from "vitest";
import { severityLevel } from "../severity";

describe("severityLevel", () => {
  it("returns UNSPECIFIED for 0", () => {
    expect(severityLevel(0)).toBe("UNSPECIFIED");
  });

  it("returns TRACE for 1–4", () => {
    expect(severityLevel(1)).toBe("TRACE");
    expect(severityLevel(4)).toBe("TRACE");
  });

  it("returns DEBUG for 5–8", () => {
    expect(severityLevel(5)).toBe("DEBUG");
    expect(severityLevel(8)).toBe("DEBUG");
  });

  it("returns INFO for 9–12", () => {
    expect(severityLevel(9)).toBe("INFO");
    expect(severityLevel(12)).toBe("INFO");
  });

  it("returns WARN for 13–16", () => {
    expect(severityLevel(13)).toBe("WARN");
    expect(severityLevel(16)).toBe("WARN");
  });

  it("returns ERROR for 17–20", () => {
    expect(severityLevel(17)).toBe("ERROR");
    expect(severityLevel(20)).toBe("ERROR");
  });

  it("returns FATAL for 21 and above", () => {
    expect(severityLevel(21)).toBe("FATAL");
    expect(severityLevel(24)).toBe("FATAL");
    expect(severityLevel(99)).toBe("FATAL");
  });
});

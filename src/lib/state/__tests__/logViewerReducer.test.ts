import { describe, it, expect } from "vitest";
import {
  initialState,
  logViewerReducer,
  LogViewerState,
} from "../logViewerReducer";
import type { FlatLogRecord } from "@/lib/otlp/types";

function makeRecord(id: string): FlatLogRecord {
  return {
    id,
    timestampMs: 1000,
    timestampDisplay: "",
    severityNumber: 9,
    severityLevel: "INFO",
    severityText: "INFO",
    body: "msg",
    attributes: {},
    serviceName: "svc",
    serviceNamespace: "ns",
    serviceVersion: "1.0.0",
    resourceAttributes: {},
    scopeAttributes: {},
  };
}

const emptyState: LogViewerState = initialState([]);

describe("initialState", () => {
  it("stores provided records", () => {
    const records = [makeRecord("a"), makeRecord("b")];
    const state = initialState(records);
    expect(state.records).toBe(records);
  });

  it("starts with defaults", () => {
    const state = initialState([]);
    expect(state.groupByService).toBe(false);
    expect(state.expandedRows.size).toBe(0);
    expect(state.collapsedGroups.size).toBe(0);
    expect(state.isRefreshing).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe("logViewerReducer", () => {
  describe("SET_RECORDS", () => {
    it("replaces records", () => {
      const records = [makeRecord("x")];
      const next = logViewerReducer(emptyState, { type: "SET_RECORDS", records });
      expect(next.records).toBe(records);
    });

    it("clears expandedRows", () => {
      const state: LogViewerState = {
        ...emptyState,
        expandedRows: new Set(["a", "b"]),
      };
      const next = logViewerReducer(state, { type: "SET_RECORDS", records: [] });
      expect(next.expandedRows.size).toBe(0);
    });

    it("clears error", () => {
      const state: LogViewerState = { ...emptyState, error: "oops" };
      const next = logViewerReducer(state, { type: "SET_RECORDS", records: [] });
      expect(next.error).toBeNull();
    });

    it("does not mutate state", () => {
      const state: LogViewerState = { ...emptyState, expandedRows: new Set(["a"]) };
      logViewerReducer(state, { type: "SET_RECORDS", records: [] });
      expect(state.expandedRows.has("a")).toBe(true);
    });
  });

  describe("TOGGLE_GROUP_BY", () => {
    it("toggles groupByService from false to true", () => {
      const next = logViewerReducer(emptyState, { type: "TOGGLE_GROUP_BY" });
      expect(next.groupByService).toBe(true);
    });

    it("toggles groupByService from true to false", () => {
      const state: LogViewerState = { ...emptyState, groupByService: true };
      const next = logViewerReducer(state, { type: "TOGGLE_GROUP_BY" });
      expect(next.groupByService).toBe(false);
    });

    it("clears collapsedGroups", () => {
      const state: LogViewerState = {
        ...emptyState,
        collapsedGroups: new Set(["g1", "g2"]),
      };
      const next = logViewerReducer(state, { type: "TOGGLE_GROUP_BY" });
      expect(next.collapsedGroups.size).toBe(0);
    });

    it("does not mutate state", () => {
      const state: LogViewerState = {
        ...emptyState,
        collapsedGroups: new Set(["g1"]),
      };
      logViewerReducer(state, { type: "TOGGLE_GROUP_BY" });
      expect(state.collapsedGroups.has("g1")).toBe(true);
    });
  });

  describe("TOGGLE_ROW", () => {
    it("expands a collapsed row", () => {
      const next = logViewerReducer(emptyState, { type: "TOGGLE_ROW", id: "row-1" });
      expect(next.expandedRows.has("row-1")).toBe(true);
    });

    it("collapses an expanded row", () => {
      const state: LogViewerState = {
        ...emptyState,
        expandedRows: new Set(["row-1"]),
      };
      const next = logViewerReducer(state, { type: "TOGGLE_ROW", id: "row-1" });
      expect(next.expandedRows.has("row-1")).toBe(false);
    });

    it("leaves other expanded rows untouched", () => {
      const state: LogViewerState = {
        ...emptyState,
        expandedRows: new Set(["row-1", "row-2"]),
      };
      const next = logViewerReducer(state, { type: "TOGGLE_ROW", id: "row-1" });
      expect(next.expandedRows.has("row-2")).toBe(true);
    });

    it("does not mutate state", () => {
      const state: LogViewerState = { ...emptyState, expandedRows: new Set() };
      logViewerReducer(state, { type: "TOGGLE_ROW", id: "row-1" });
      expect(state.expandedRows.has("row-1")).toBe(false);
    });
  });

  describe("TOGGLE_GROUP", () => {
    it("collapses an expanded group", () => {
      const next = logViewerReducer(emptyState, { type: "TOGGLE_GROUP", key: "g1" });
      expect(next.collapsedGroups.has("g1")).toBe(true);
    });

    it("expands a collapsed group", () => {
      const state: LogViewerState = {
        ...emptyState,
        collapsedGroups: new Set(["g1"]),
      };
      const next = logViewerReducer(state, { type: "TOGGLE_GROUP", key: "g1" });
      expect(next.collapsedGroups.has("g1")).toBe(false);
    });

    it("leaves other groups untouched", () => {
      const state: LogViewerState = {
        ...emptyState,
        collapsedGroups: new Set(["g1", "g2"]),
      };
      const next = logViewerReducer(state, { type: "TOGGLE_GROUP", key: "g1" });
      expect(next.collapsedGroups.has("g2")).toBe(true);
    });

    it("does not mutate state", () => {
      const state: LogViewerState = { ...emptyState, collapsedGroups: new Set() };
      logViewerReducer(state, { type: "TOGGLE_GROUP", key: "g1" });
      expect(state.collapsedGroups.has("g1")).toBe(false);
    });
  });

  describe("SET_REFRESHING", () => {
    it("sets isRefreshing to true", () => {
      const next = logViewerReducer(emptyState, { type: "SET_REFRESHING", value: true });
      expect(next.isRefreshing).toBe(true);
    });

    it("sets isRefreshing to false", () => {
      const state: LogViewerState = { ...emptyState, isRefreshing: true };
      const next = logViewerReducer(state, { type: "SET_REFRESHING", value: false });
      expect(next.isRefreshing).toBe(false);
    });
  });

  describe("SET_ERROR", () => {
    it("sets an error message", () => {
      const next = logViewerReducer(emptyState, { type: "SET_ERROR", error: "failed" });
      expect(next.error).toBe("failed");
    });

    it("clears the error when passed null", () => {
      const state: LogViewerState = { ...emptyState, error: "oops" };
      const next = logViewerReducer(state, { type: "SET_ERROR", error: null });
      expect(next.error).toBeNull();
    });
  });

  it("returns state unchanged for unknown actions", () => {
    // @ts-expect-error testing unhandled action
    const next = logViewerReducer(emptyState, { type: "UNKNOWN" });
    expect(next).toBe(emptyState);
  });
});

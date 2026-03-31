import { describe, it, expect } from "vitest";
import { buildHistogramBuckets } from "../histogram";
import type { FlatLogRecord } from "../types";

function makeRecord(timestampMs: number, severityLevel: FlatLogRecord["severityLevel"] = "INFO"): FlatLogRecord {
  return {
    id: String(timestampMs),
    timestampMs,
    timestampDisplay: "",
    severityNumber: 9,
    severityLevel,
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

describe("buildHistogramBuckets", () => {
  it("returns empty array for no records", () => {
    expect(buildHistogramBuckets([])).toEqual([]);
  });

  it("returns a single bucket when all records share the same timestamp", () => {
    const records = [
      makeRecord(1000, "INFO"),
      makeRecord(1000, "ERROR"),
      makeRecord(1000, "DEBUG"),
    ];
    const buckets = buildHistogramBuckets(records);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].count).toBe(3);
    expect(buckets[0].startMs).toBe(1000);
    expect(buckets[0].breakdown.INFO).toBe(1);
    expect(buckets[0].breakdown.ERROR).toBe(1);
    expect(buckets[0].breakdown.DEBUG).toBe(1);
  });

  it("creates bucketCount buckets by default (20)", () => {
    const records = [makeRecord(0), makeRecord(1000)];
    const buckets = buildHistogramBuckets(records);
    expect(buckets).toHaveLength(20);
  });

  it("respects custom bucketCount", () => {
    const records = [makeRecord(0), makeRecord(1000)];
    expect(buildHistogramBuckets(records, 10)).toHaveLength(10);
    expect(buildHistogramBuckets(records, 5)).toHaveLength(5);
  });

  it("assigns records to the correct bucket", () => {
    // minTs=1000, maxTs=2000, bucketCount=10 → bucketWidth=100
    // record at 1342 → (1342-1000)/100 = 3.42 → index 3
    const records = [makeRecord(1000), makeRecord(2000), makeRecord(1342)];
    const buckets = buildHistogramBuckets(records, 10);

    // bucket 0 starts at 1000 (minTs)
    expect(buckets[0].startMs).toBe(1000);
    expect(buckets[0].count).toBe(1);

    // bucket 3 covers 1300–1399
    expect(buckets[3].count).toBe(1);
  });

  it("clamps record at maxTs to the last bucket", () => {
    // record exactly at maxTs → index = bucketCount (out of bounds) → clamped to bucketCount-1
    const records = [makeRecord(1000), makeRecord(2000)];
    const buckets = buildHistogramBuckets(records, 10);
    expect(buckets[9].count).toBe(1);
  });

  it("tracks severity breakdown per bucket", () => {
    const records = [
      makeRecord(1000, "INFO"),
      makeRecord(2000, "ERROR"),
      makeRecord(1000, "WARN"),
    ];
    const buckets = buildHistogramBuckets(records, 10);

    // INFO and WARN land in bucket 0
    expect(buckets[0].breakdown.INFO).toBe(1);
    expect(buckets[0].breakdown.WARN).toBe(1);
    expect(buckets[0].breakdown.ERROR).toBe(0);

    // ERROR lands in last bucket
    expect(buckets[9].breakdown.ERROR).toBe(1);
  });

  it("total count across all buckets equals number of records", () => {
    const records = Array.from({ length: 50 }, (_, i) => makeRecord(i * 100));
    const buckets = buildHistogramBuckets(records, 20);
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(50);
  });

  it("each bucket has a label string", () => {
    const records = [makeRecord(0), makeRecord(1000)];
    const buckets = buildHistogramBuckets(records, 5);
    for (const b of buckets) {
      expect(typeof b.label).toBe("string");
      expect(b.label.length).toBeGreaterThan(0);
    }
  });

  it("breakdown includes all severity levels initialized to 0", () => {
    const records = [makeRecord(0), makeRecord(1000)];
    const buckets = buildHistogramBuckets(records, 2);
    for (const b of buckets) {
      expect(b.breakdown).toMatchObject({
        UNSPECIFIED: expect.any(Number),
        TRACE: expect.any(Number),
        DEBUG: expect.any(Number),
        INFO: expect.any(Number),
        WARN: expect.any(Number),
        ERROR: expect.any(Number),
        FATAL: expect.any(Number),
      });
    }
  });
});

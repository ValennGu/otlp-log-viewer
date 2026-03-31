import { FlatLogRecord, SeverityLevel } from "./types";
import { SEVERITY_LEVELS } from "./severity";

export interface HistogramBucket {
  label: string;
  startMs: number;
  count: number;
  breakdown: Record<SeverityLevel, number>;
}

function emptyBreakdown(): Record<SeverityLevel, number> {
  return Object.fromEntries(SEVERITY_LEVELS.map((l) => [l, 0])) as Record<
    SeverityLevel,
    number
  >;
}

export function buildHistogramBuckets(
  records: FlatLogRecord[],
  bucketCount = 20,
): HistogramBucket[] {
  if (records.length === 0) return [];

  const timestamps = records.map((r) => r.timestampMs);
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  if (minTs === maxTs) {
    const bucket: HistogramBucket = {
      label: new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(minTs)),
      startMs: minTs,
      count: records.length,
      breakdown: emptyBreakdown(),
    };
    for (const r of records) bucket.breakdown[r.severityLevel]++;
    return [bucket];
  }

  // Creates empty buckets.
  const bucketWidth = (maxTs - minTs) / bucketCount;
  const buckets: HistogramBucket[] = Array.from(
    { length: bucketCount },
    (_, i) => ({
      label: new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(minTs + i * bucketWidth)),
      startMs: minTs + i * bucketWidth,
      count: 0,
      breakdown: emptyBreakdown(),
    }),
  );

  for (const record of records) {
    /*
     * Gets the target bucket index. Example:
     * (1342 - 1000) / 100 = 3.42
     * Math.floor(3.42)    = 3       ← bucket index 3
     * Math.min(3, 9)      = 3       ← within bounds, no clamp needed
     */

    const idx = Math.min(
      Math.floor((record.timestampMs - minTs) / bucketWidth),
      bucketCount - 1,
    );
    buckets[idx].count++;
    buckets[idx].breakdown[record.severityLevel]++;
  }

  return buckets;
}

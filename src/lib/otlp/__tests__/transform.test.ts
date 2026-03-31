import { describe, it, expect } from "vitest";
import { transformOtlpResponse, groupByService } from "../transform";
import type { FlatLogRecord } from "../types";

// A minimal valid OTLP log record builder
function makeOtlpResponse(overrides?: {
  serviceName?: string;
  serviceNamespace?: string;
  serviceVersion?: string;
  timeUnixNano?: string;
  severityNumber?: number;
  severityText?: string;
  body?: unknown;
  attributes?: { key: string; value: { stringValue: string } }[];
}) {
  const o = overrides ?? {};
  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: o.serviceName ?? "my-service" } },
            { key: "service.namespace", value: { stringValue: o.serviceNamespace ?? "my-ns" } },
            { key: "service.version", value: { stringValue: o.serviceVersion ?? "1.0.0" } },
          ],
        },
        scopeLogs: [
          {
            scope: { attributes: [], droppedAttributesCount: 0 },
            logRecords: [
              {
                timeUnixNano: o.timeUnixNano ?? "1000000000000000",
                observedTimeUnixNano: o.timeUnixNano ?? "1000000000000000",
                severityNumber: o.severityNumber ?? 9,
                severityText: o.severityText ?? "INFO",
                body: o.body !== undefined ? o.body : { stringValue: "hello world" },
                attributes: o.attributes ?? [],
                droppedAttributesCount: 0,
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("transformOtlpResponse", () => {
  it("returns empty array for empty response", () => {
    expect(transformOtlpResponse({})).toEqual([]);
    expect(transformOtlpResponse({ resourceLogs: [] })).toEqual([]);
    expect(transformOtlpResponse(null)).toEqual([]);
  });

  it("flattens a single log record correctly", () => {
    const response = makeOtlpResponse({
      timeUnixNano: "1704310101995000000",
      severityNumber: 9,
      severityText: "INFO",
    });

    const records = transformOtlpResponse(response);
    expect(records).toHaveLength(1);

    const r = records[0];
    expect(r.id).toBe("0-0-0");
    expect(r.serviceName).toBe("my-service");
    expect(r.serviceNamespace).toBe("my-ns");
    expect(r.serviceVersion).toBe("1.0.0");
    expect(r.severityNumber).toBe(9);
    expect(r.severityLevel).toBe("INFO");
    expect(r.severityText).toBe("INFO");
    expect(r.body).toBe("hello world");
    // 1704310101995000000 ns → 1704310101995 ms
    expect(r.timestampMs).toBe(1704310101995);
  });

  it("converts timeUnixNano to milliseconds correctly", () => {
    // 2_000_000_000 ms = 2_000_000_000_000_000 ns
    const [record] = transformOtlpResponse(
      makeOtlpResponse({ timeUnixNano: "2000000000000000000" }),
    );
    expect(record.timestampMs).toBe(2000000000000);
  });

  it("falls back to timestampMs=0 when timeUnixNano is missing", () => {
    const response = makeOtlpResponse();
    // Force timeUnixNano to be undefined
    response.resourceLogs[0].scopeLogs[0].logRecords[0].timeUnixNano =
      undefined as unknown as string;
    const [record] = transformOtlpResponse(response);
    expect(record.timestampMs).toBe(0);
  });

  it("serializes non-string body as JSON", () => {
    const [record] = transformOtlpResponse(
      makeOtlpResponse({ body: { kvlistValue: { key: "x" } } }),
    );
    expect(record.body).toBe(JSON.stringify({ kvlistValue: { key: "x" } }));
  });

  it("returns empty string for missing body", () => {
    const [record] = transformOtlpResponse(makeOtlpResponse({ body: null }));
    expect(record.body).toBe("");
  });

  it("falls back to empty string for missing severityText", () => {
    const response = makeOtlpResponse();
    response.resourceLogs[0].scopeLogs[0].logRecords[0].severityText =
      undefined as unknown as string;
    const [record] = transformOtlpResponse(response);
    expect(record.severityText).toBe("");
  });

  it("sorts records by descending timestamp", () => {
    const response = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: "service.name", value: { stringValue: "svc" } },
              { key: "service.namespace", value: { stringValue: "ns" } },
              { key: "service.version", value: { stringValue: "1.0.0" } },
            ],
          },
          scopeLogs: [
            {
              scope: { attributes: [] },
              logRecords: [
                { timeUnixNano: "1000000000000000", severityNumber: 9, severityText: "INFO", body: { stringValue: "first" }, attributes: [], droppedAttributesCount: 0 },
                { timeUnixNano: "3000000000000000", severityNumber: 9, severityText: "INFO", body: { stringValue: "third" }, attributes: [], droppedAttributesCount: 0 },
                { timeUnixNano: "2000000000000000", severityNumber: 9, severityText: "INFO", body: { stringValue: "second" }, attributes: [], droppedAttributesCount: 0 },
              ],
            },
          ],
        },
      ],
    };
    const records = transformOtlpResponse(response);
    expect(records.map((r) => r.body)).toEqual(["third", "second", "first"]);
  });

  it("assigns unique ids across resources, scopes and records", () => {
    const response = {
      resourceLogs: [
        {
          resource: { attributes: [{ key: "service.name", value: { stringValue: "a" } }, { key: "service.namespace", value: { stringValue: "ns" } }, { key: "service.version", value: { stringValue: "1.0.0" } }] },
          scopeLogs: [
            {
              scope: { attributes: [] },
              logRecords: [
                { timeUnixNano: "1000000000000000", severityNumber: 9, severityText: "INFO", body: { stringValue: "a0" }, attributes: [], droppedAttributesCount: 0 },
                { timeUnixNano: "2000000000000000", severityNumber: 9, severityText: "INFO", body: { stringValue: "a1" }, attributes: [], droppedAttributesCount: 0 },
              ],
            },
          ],
        },
        {
          resource: { attributes: [{ key: "service.name", value: { stringValue: "b" } }, { key: "service.namespace", value: { stringValue: "ns" } }, { key: "service.version", value: { stringValue: "1.0.0" } }] },
          scopeLogs: [
            {
              scope: { attributes: [] },
              logRecords: [
                { timeUnixNano: "3000000000000000", severityNumber: 9, severityText: "INFO", body: { stringValue: "b0" }, attributes: [], droppedAttributesCount: 0 },
              ],
            },
          ],
        },
      ],
    };
    const records = transformOtlpResponse(response);
    const ids = records.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("groupByService", () => {
  function makeRecord(overrides: Partial<FlatLogRecord> = {}): FlatLogRecord {
    return {
      id: "0-0-0",
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
      ...overrides,
    };
  }

  it("returns empty array for empty input", () => {
    expect(groupByService([])).toEqual([]);
  });

  it("groups records by service name+namespace+version", () => {
    const records = [
      makeRecord({ id: "1", serviceName: "alpha", serviceNamespace: "ns", serviceVersion: "1.0.0" }),
      makeRecord({ id: "2", serviceName: "alpha", serviceNamespace: "ns", serviceVersion: "1.0.0" }),
      makeRecord({ id: "3", serviceName: "beta", serviceNamespace: "ns", serviceVersion: "1.0.0" }),
    ];
    const groups = groupByService(records);
    expect(groups).toHaveLength(2);
    const alpha = groups.find((g) => g.serviceName === "alpha")!;
    expect(alpha.records).toHaveLength(2);
    const beta = groups.find((g) => g.serviceName === "beta")!;
    expect(beta.records).toHaveLength(1);
  });

  it("treats same name+different namespace as distinct groups", () => {
    const records = [
      makeRecord({ id: "1", serviceName: "svc", serviceNamespace: "ns-a" }),
      makeRecord({ id: "2", serviceName: "svc", serviceNamespace: "ns-b" }),
    ];
    expect(groupByService(records)).toHaveLength(2);
  });

  it("treats same name+different version as distinct groups", () => {
    const records = [
      makeRecord({ id: "1", serviceVersion: "1.0.0" }),
      makeRecord({ id: "2", serviceVersion: "2.0.0" }),
    ];
    expect(groupByService(records)).toHaveLength(2);
  });

  it("sorts groups alphabetically by service name", () => {
    const records = [
      makeRecord({ id: "1", serviceName: "zebra" }),
      makeRecord({ id: "2", serviceName: "alpha" }),
      makeRecord({ id: "3", serviceName: "mango" }),
    ];
    const names = groupByService(records).map((g) => g.serviceName);
    expect(names).toEqual(["alpha", "mango", "zebra"]);
  });

  it("group key is name|namespace|version", () => {
    const records = [makeRecord({ serviceName: "svc", serviceNamespace: "ns", serviceVersion: "1.0.0" })];
    const [group] = groupByService(records);
    expect(group.key).toBe("svc|ns|1.0.0");
  });
});

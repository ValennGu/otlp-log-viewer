export type SeverityLevel =
  | "UNSPECIFIED"
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "FATAL";

export interface FlatLogRecord {
  id: string;
  timestampMs: number;
  timestampDisplay: string;
  severityNumber: number;
  severityLevel: SeverityLevel;
  severityText: string;
  body: string;
  attributes: Record<string, string>;
  serviceName: string;
  serviceNamespace: string;
  serviceVersion: string;
  resourceAttributes: Record<string, string>;
  scopeAttributes: Record<string, string>;
}

export interface ServiceGroup {
  key: string;
  serviceName: string;
  serviceNamespace: string;
  serviceVersion: string;
  records: FlatLogRecord[];
}

import { FlatLogRecord, ServiceGroup } from "./types";
import { severityLevel } from "./severity";

interface IResourceAttribute {
  key: string;
  value?: {
    stringValue?: string;
    intValue?: number | string;
    doubleValue?: number;
    boolValue?: boolean;
    [key: string]: unknown;
  };
}

function resourceAttributeToRecord(
  kvs: IResourceAttribute[] | undefined,
): Record<string, string> {
  if (!kvs) return {};
  const result: Record<string, string> = {};
  for (const kv of kvs) {
    const v = kv.value;
    if (!v) continue;
    if (v.stringValue !== undefined) result[kv.key] = v.stringValue;
    else if (v.intValue !== undefined) result[kv.key] = String(v.intValue);
    else if (v.doubleValue !== undefined)
      result[kv.key] = String(v.doubleValue);
    else if (v.boolValue !== undefined) result[kv.key] = String(v.boolValue);
    else result[kv.key] = JSON.stringify(v);
  }
  return result;
}

/**
 * The endpoint returns OTLP (OpenTelemetry Protocol) log data — JSON structured as:                                          
                                                                                                                            
  resourceLogs[]                                                                                                             
    └─ resource     ← tells the actual service logs belong to.                                                                                                      
    │    └─ attributes: service.namespace, service.name, service.version                                                     
    └─ scopeLogs[]                                                                                                           
         └─ scope
         │    └─ attributes     ← tells the actual instrumentation all logs in the scope have.                                        
         └─ logRecords[]                                                                                                     
              ├─ timeUnixNano                                                                                                
              ├─ observedTimeUnixNano                                                                                        
              ├─ severityNumber (0–24)                                                                                       
              ├─ severityText (TRACE / DEBUG / INFO / WARN / ERROR / FATAL / UNSPECIFIED)                                    
              └─ body.stringValue  ← the actual log message  
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformOtlpResponse(response: any): FlatLogRecord[] {
  const records: FlatLogRecord[] = [];
  const resourceLogs = response?.resourceLogs ?? [];

  for (let ri = 0; ri < resourceLogs.length; ri++) {
    const rl = resourceLogs[ri];
    const resourceAttrs = resourceAttributeToRecord(rl?.resource?.attributes);
    const serviceName = resourceAttrs["service.name"] ?? "";
    const serviceNamespace = resourceAttrs["service.namespace"] ?? "";
    const serviceVersion = resourceAttrs["service.version"] ?? "";
    const scopeLogs = rl?.scopeLogs ?? [];

    for (let si = 0; si < scopeLogs.length; si++) {
      const sl = scopeLogs[si];
      const scopeAttrs = resourceAttributeToRecord(sl?.scope?.attributes);
      const logRecords = sl?.logRecords ?? [];

      for (let li = 0; li < logRecords.length; li++) {
        const lr = logRecords[li];

        // --- Next lines could be extracted to a utils. TODO: Consider a refactor on this.
        const raw: string = lr?.timeUnixNano ?? "0";
        const timestampMs = Number(BigInt(raw) / BigInt(1_000_000));
        const timestampDisplay = new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
          hour12: false,
        }).format(new Date(timestampMs));
        // ---
        // End of utils extraction candidate.

        const severityNum: number = lr?.severityNumber ?? 0;
        const level = severityLevel(severityNum);
        const attributes = resourceAttributeToRecord(lr?.attributes);

        let body = "";
        const bodyValue = lr?.body;
        if (bodyValue?.stringValue !== undefined) {
          body = bodyValue.stringValue;
        } else if (bodyValue) {
          body = JSON.stringify(bodyValue);
        }

        records.push({
          id: `${ri}-${si}-${li}`,
          timestampMs,
          timestampDisplay,
          severityNumber: severityNum,
          severityLevel: level,
          severityText: lr?.severityText ?? "",
          body,
          attributes,
          serviceName,
          serviceNamespace,
          serviceVersion,
          resourceAttributes: resourceAttrs,
          scopeAttributes: scopeAttrs,
        });
      }
    }
  }

  records.sort((a, b) => b.timestampMs - a.timestampMs);
  return records;
}

export function groupByService(records: FlatLogRecord[]): ServiceGroup[] {
  const map = new Map<string, ServiceGroup>();
  for (const record of records) {
    const key = [
      record.serviceName,
      record.serviceNamespace,
      record.serviceVersion,
    ].join("|");
    if (!map.has(key)) {
      map.set(key, {
        key,
        serviceName: record.serviceName,
        serviceNamespace: record.serviceNamespace,
        serviceVersion: record.serviceVersion,
        records: [],
      });
    }
    map.get(key)!.records.push(record);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.serviceName.localeCompare(b.serviceName),
  );
}

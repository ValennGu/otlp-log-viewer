import { FlatLogRecord } from "@/lib/otlp/types";
import { transformOtlpResponse } from "@/lib/otlp/transform";

const API_URL = "https://take-home-assignment-otlp-logs-api.vercel.app/api/logs";

export { API_URL };

export async function fetchAndTransformLogs(): Promise<FlatLogRecord[]> {
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return transformOtlpResponse(await res.json());
}

import { SeverityLevel } from "./types";

export const SEVERITY_LEVELS: SeverityLevel[] = [
  "UNSPECIFIED",
  "TRACE",
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "FATAL",
];

// TODO: Consider a refactor on this.
export function severityLevel(n: number): SeverityLevel {
  if (n === 0) return SEVERITY_LEVELS[0];
  if (n <= 4) return SEVERITY_LEVELS[1];
  if (n <= 8) return SEVERITY_LEVELS[2];
  if (n <= 12) return SEVERITY_LEVELS[3];
  if (n <= 16) return SEVERITY_LEVELS[4];
  if (n <= 20) return SEVERITY_LEVELS[5];
  return SEVERITY_LEVELS[6];
}

// From here -- just CSS utils.

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  UNSPECIFIED: "#94a3b8",
  TRACE: "#a78bfa",
  DEBUG: "#60a5fa",
  INFO: "#34d399",
  WARN: "#fbbf24",
  ERROR: "#f87171",
  FATAL: "#dc2626",
};

export const SEVERITY_BADGE_CLASSES: Record<SeverityLevel, string> = {
  UNSPECIFIED: "bg-slate-100 text-slate-600",
  TRACE: "bg-violet-100 text-violet-700",
  DEBUG: "bg-blue-100 text-blue-700",
  INFO: "bg-emerald-100 text-emerald-700",
  WARN: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
  FATAL: "bg-red-200 text-red-900",
};

export const SEVERITY_ROW_CLASSES: Partial<Record<SeverityLevel, string>> = {
  WARN: "bg-amber-50",
  ERROR: "bg-red-50",
  FATAL: "bg-red-100",
};

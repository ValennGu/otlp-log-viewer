"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HistogramBucket } from "@/lib/otlp/histogram";
import { SEVERITY_LEVELS, SEVERITY_COLORS } from "@/lib/otlp/severity";
import { SeverityLevel } from "@/lib/otlp/types";

interface Props {
  buckets: HistogramBucket[];
}

function HistogramTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter((p) => p.value > 0);
  if (!filtered.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded shadow-md p-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {filtered.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-sm"
            style={{ backgroundColor: p.fill }}
          />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function LogHistogram({ buckets }: Props) {
  if (buckets.length === 0) return null;
  return (
    <div className="w-full h-28">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10 }}
            width={28}
            tickLine={false}
          />
          <Tooltip
            content={
              <HistogramTooltip />
            }
          />
          {SEVERITY_LEVELS.map((level: SeverityLevel) => (
            <Bar
              key={level}
              dataKey={`breakdown.${level}`}
              stackId="a"
              fill={SEVERITY_COLORS[level]}
              name={level}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

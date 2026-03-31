# OTLP Log Viewer — Part 1 Implementation Plan

## Context

This implements Part 1 of the Dash0 take-home assignment. The goal is to build a log viewer UI that fetches OTLP log data from a provided API and presents it with three core features: a table with expandable rows, a time-distribution histogram, and a group-by-service toggle.

This is a **brand new repository** — no existing code is available. The project is bootstrapped from scratch.

API endpoint: `https://take-home-assignment-otlp-logs-api.vercel.app/api/logs`

---

## Step 1 — Bootstrap the Project

```bash
npx create-next-app@latest otlp-log-viewer \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
cd otlp-log-viewer
```

This gives us: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, ESLint — all pre-configured.

Then add the one additional runtime dependency:

```bash
npm install recharts @opentelemetry/otlp-transformer
```

No `postcss.config.mjs` needed — `create-next-app` with `--tailwind` sets it up automatically.

---

## Step 2 — Data Layer (pure functions, no React)

### `src/lib/otlp/types.ts`
Define:
- `SeverityLevel` — union: `"UNSPECIFIED" | "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL"`
- `FlatLogRecord` — flat record with: `id`, `timestampMs`, `timestampDisplay`, `severityNumber`, `severityLevel`, `severityText`, `body`, `attributes`, `serviceName`, `serviceNamespace`, `serviceVersion`, `resourceAttributes`, `scopeAttributes`
- `ServiceGroup` — `{ key, serviceName, serviceNamespace, serviceVersion, records[] }`

### `src/lib/otlp/severity.ts`
- `SEVERITY_LEVELS` array (ordered)
- `SEVERITY_COLORS` map (hex, for recharts)
- `SEVERITY_BADGE_CLASSES` map (Tailwind classes for pills)
- `SEVERITY_ROW_CLASSES` map (faint row tint for WARN/ERROR/FATAL)
- `severityLevel(n: number): SeverityLevel` — maps OTLP 0-24 ranges:
  - 0 → UNSPECIFIED, 1-4 → TRACE, 5-8 → DEBUG, 9-12 → INFO,
  - 13-16 → WARN, 17-20 → ERROR, 21-24 → FATAL

### `src/lib/otlp/transform.ts`
- `kvToRecord(kvs): Record<string, string>` — IKeyValue[] → flat map
- `transformOtlpResponse(response): FlatLogRecord[]`
  - Iterate `resourceLogs → scopeLogs → logRecords`
  - Hoist resource/scope attributes onto each record
  - Convert `timeUnixNano` (string): `Number(BigInt(raw) / BigInt(1_000_000))` — **must use BigInt** (ns timestamps exceed MAX_SAFE_INTEGER)
  - Build stable `id`: `${resourceIdx}-${scopeIdx}-${recordIdx}`
  - Sort by `timestampMs` descending (newest first)
- `groupByService(records): ServiceGroup[]` — group by `serviceName`, sort alphabetically

### `src/lib/otlp/histogram.ts`
- `HistogramBucket` — `{ label, startMs, count, breakdown: Record<SeverityLevel, number> }`
- `buildHistogramBuckets(records, bucketCount = 20): HistogramBucket[]`
  - Find min/max timestamps, compute `bucketWidth`
  - Each record → `Math.floor((ts - minTs) / bucketWidth)`, clamped to last bucket
  - Format labels with `Intl.DateTimeFormat`
  - Handle edge cases: 0 records → `[]`, single record → 1 bucket

### `src/lib/api/fetchLogs.ts`
```typescript
export async function fetchAndTransformLogs(): Promise<FlatLogRecord[]> {
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return transformOtlpResponse(await res.json());
}
```

### `src/lib/state/logViewerReducer.ts`
State shape:
```typescript
{
  records: FlatLogRecord[];
  groupByService: boolean;
  expandedRows: Set<string>;    // by record.id
  collapsedGroups: Set<string>; // by ServiceGroup.key
  isRefreshing: boolean;
  error: string | null;
}
```
Actions: `SET_RECORDS`, `TOGGLE_GROUP_BY`, `TOGGLE_ROW`, `TOGGLE_GROUP`, `SET_REFRESHING`, `SET_ERROR`

Note: Always create new `Set` copies in reducer — never mutate.

---

## Step 3 — Styling Scaffold

`create-next-app --tailwind` already generates `src/app/globals.css` with Tailwind directives and wires it into `layout.tsx`. Only changes needed:

Modify `src/app/layout.tsx`:
- Update metadata title to `"OTLP Log Viewer"`
- Add `font-sans antialiased` to `<body>` (replace the default `geist` font classes if present)

Modify `src/app/globals.css`:
- Keep Tailwind directives; remove any boilerplate demo styles

---

## Step 4 — Component Tree

```
page.tsx (RSC — server fetch, Suspense boundary)
  └── LogViewerShell (Client — owns all state via useReducer)
       ├── LogViewerToolbar (Client — heading, count, group-by toggle, refresh)
       ├── LogHistogram (Client — recharts BarChart, stacked by severity)
       └── LogTable (Client — flat or grouped table)
            ├── LogGroupHeader (Client — collapsible service group row)
            ├── LogTableRow (Client — expandable log row)
            │    └── LogRecordDetail (pure — 3-column attribute panels)
            └── SeverityBadge (pure — colored pill)
```

### `src/components/SeverityBadge.tsx`
Props: `{ level: SeverityLevel; text?: string }`
Renders a small `<span>` with `SEVERITY_BADGE_CLASSES[level]` Tailwind classes.

### `src/components/LogRecordDetail.tsx`
Props: `{ record: FlatLogRecord }`
Renders 3-column `<dl>` panels: Log Attributes / Resource Attributes / Scope Attributes.
Keys in monospace, muted; values in normal weight.

### `src/components/LogGroupHeader.tsx`
Props: `{ group: ServiceGroup; isCollapsed: boolean; onToggle: () => void }`
A `<tr>` with `colSpan={3}`: chevron icon + service name (bold) + namespace + version badge + count badge.

### `src/components/LogTableRow.tsx`
Props: `{ record: FlatLogRecord; isExpanded: boolean; onToggle: () => void }`
- Main `<tr>`: severity badge | timestamp | body (truncated). Click anywhere to toggle.
- When expanded: immediately followed by a second `<tr>` with `<td colSpan={3}>` containing `<LogRecordDetail>`.
- Apply `SEVERITY_ROW_CLASSES` for WARN/ERROR/FATAL rows.

### `src/components/LogTable.tsx`
Props: `{ records, groups: ServiceGroup[] | null, expandedRows, collapsedGroups, onToggleRow, onToggleGroup }`
One `<table>` element throughout (preserves column alignment across groups).
- `groups === null`: flat mode — thead + one `LogTableRow` per record
- `groups !== null`: group header `<tr>` followed by `LogTableRow` children per group

### `src/components/LogHistogram.tsx`
Props: `{ buckets: HistogramBucket[] }`
```tsx
<ResponsiveContainer width="100%" height={120}>
  <BarChart data={buckets}>
    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
    <Tooltip content={<HistogramTooltip />} />
    {SEVERITY_LEVELS.map(level => (
      <Bar key={level} dataKey={`breakdown.${level}`} stackId="a"
           fill={SEVERITY_COLORS[level]} name={level} />
    ))}
  </BarChart>
</ResponsiveContainer>
```
Custom `HistogramTooltip` component (inline) to properly render `breakdown` nested keys.

### `src/components/LogViewerToolbar.tsx`
Props: `{ totalCount, groupByService, isRefreshing, onToggleGroupBy, onRefresh }`
- Left: "Logs" heading + count badge
- Right: `<button role="switch" aria-checked={groupByService}>Group by service</button>` + Refresh button (spinner icon when `isRefreshing`)

### `src/components/LogViewerShell.tsx`
`"use client"` — initializes `useReducer(logViewerReducer, initialState(initialRecords))`
Derives with `useMemo`:
- `histogramBuckets = buildHistogramBuckets(state.records)`
- `serviceGroups = state.groupByService ? groupByService(state.records) : null`

Refresh handler: `fetch(API_URL)` → `transformOtlpResponse` → `dispatch SET_RECORDS`

---

## Step 5 — Page Integration

Replace the generated `src/app/page.tsx` boilerplate:
```tsx
export default async function Page() {
  const records = await fetchAndTransformLogs();
  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-6">
      <LogViewerShell initialRecords={records} />
    </main>
  );
}
```

Add `<Suspense fallback={<LogViewerSkeleton />}>` wrapper and a minimal loading skeleton component inline in `page.tsx`.

---

## File Manifest

### Bootstrapped by `create-next-app` (exist already, some need modification)
| File | Action |
|------|--------|
| `src/app/globals.css` | MODIFY — remove demo styles, keep Tailwind directives |
| `src/app/layout.tsx` | MODIFY — update title, simplify body classes |
| `src/app/page.tsx` | REPLACE — RSC fetch + Suspense (discard boilerplate) |
| `package.json` | MODIFY — add `recharts`, `@opentelemetry/otlp-transformer` |
| `postcss.config.mjs` | EXISTS — no changes needed |
| `tailwind.config.ts` | EXISTS — no changes needed |
| `tsconfig.json` | EXISTS — no changes needed |
| `next.config.ts` | EXISTS — no changes needed |

### New files to create
| File | Purpose |
|------|---------|
| `src/lib/otlp/types.ts` | FlatLogRecord, ServiceGroup interfaces |
| `src/lib/otlp/severity.ts` | Severity level map, color map, badge classes |
| `src/lib/otlp/transform.ts` | transformOtlpResponse, groupByService |
| `src/lib/otlp/histogram.ts` | buildHistogramBuckets |
| `src/lib/api/fetchLogs.ts` | Server-side fetch + transform |
| `src/lib/state/logViewerReducer.ts` | Reducer, actions, initial state |
| `src/components/SeverityBadge.tsx` | Colored severity pill |
| `src/components/LogRecordDetail.tsx` | Expanded attribute panels |
| `src/components/LogGroupHeader.tsx` | Collapsible service group row |
| `src/components/LogTableRow.tsx` | Expandable log row |
| `src/components/LogTable.tsx` | Flat/grouped table switcher |
| `src/components/LogHistogram.tsx` | Recharts stacked bar chart |
| `src/components/LogViewerToolbar.tsx` | Heading, toggle, refresh button |
| `src/components/LogViewerShell.tsx` | Top-level client state container |

---

## Verification

1. `npm install` — no peer dep errors
2. `npm run dev` — dev server starts, page loads at localhost:3000
3. Page shows log table with Severity/Time/Body columns
4. Clicking a row expands to show attributes panel
5. Histogram renders above the table with stacked severity bars
6. "Group by service" toggle switches between flat and grouped view
7. Collapsing a group hides its rows
8. "Refresh" button fetches new random data and re-renders everything
9. `npm run build` — TypeScript compiles with no errors

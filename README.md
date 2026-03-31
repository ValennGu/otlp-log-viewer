# OTLP Log Viewer

A Next.js application for visualizing OpenTelemetry (OTLP) log data. It fetches logs from a remote API, displays them in a sortable table with a severity histogram, and supports grouping by service.

## Requirements

- Node.js 20+
- npm

## Running the project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

| Command | Description |
|---|---|
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run unit tests |
| `npm run lint` | Lint the codebase |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              page.tsx  (Server)                 │   │
│   │                                                 │   │
│   │  On load: fetchAndTransformLogs()               │   │
│   │      │                                          │   │
│   │      ▼                                          │   │
│   │  ┌──────────────────────────────────────────┐   │   │
│   │  │         LogViewerShell  (Client)         │   │   │
│   │  │                                          │   │   │
│   │  │  useReducer(logViewerReducer)            │   │   │
│   │  │                                          │   │   │
│   │  │  ┌─────────────────────────────────┐    │   │   │
│   │  │  │       LogViewerToolbar          │    │   │   │
│   │  │  │  refresh · group-by-service     │    │   │   │
│   │  │  └─────────────────────────────────┘    │   │   │
│   │  │  ┌─────────────────────────────────┐    │   │   │
│   │  │  │         LogHistogram            │    │   │   │
│   │  │  │  severity breakdown over time   │    │   │   │
│   │  │  └─────────────────────────────────┘    │   │   │
│   │  │  ┌─────────────────────────────────┐    │   │   │
│   │  │  │           LogTable              │    │   │   │
│   │  │  │  ┌───────────────────────────┐  │    │   │   │
│   │  │  │  │  LogGroupHeader (opt.)    │  │    │   │   │
│   │  │  │  └───────────────────────────┘  │    │   │   │
│   │  │  │  ┌───────────────────────────┐  │    │   │   │
│   │  │  │  │      LogTableRow          │  │    │   │   │
│   │  │  │  │  ┌─────────────────────┐  │  │    │   │   │
│   │  │  │  │  │  LogRecordDetail    │  │  │    │   │   │
│   │  │  │  │  │  (expanded row)     │  │  │    │   │   │
│   │  │  │  │  └─────────────────────┘  │  │    │   │   │
│   │  │  │  └───────────────────────────┘  │    │   │   │
│   │  │  └─────────────────────────────────┘    │   │   │
│   │  └──────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     src/lib                             │
│                                                         │
│  api/                                                   │
│    fetchLogs.ts       fetch + parse the remote API      │
│                                                         │
│  otlp/                                                  │
│    types.ts           FlatLogRecord, ServiceGroup       │
│    transform.ts       OTLP JSON → FlatLogRecord[]       │
│    histogram.ts       records → HistogramBucket[]       │
│    severity.ts        severity number → level + styles  │
│                                                         │
│  state/                                                 │
│    logViewerReducer.ts  useReducer state & actions      │
└─────────────────────────────────────────────────────────┘

External API
  https://take-home-assignment-otlp-logs-api.vercel.app/api/logs
  └─ returns OTLP JSON (resourceLogs[])
```

### Data flow

1. `page.tsx` runs on the server, calls `fetchAndTransformLogs()` which fetches the OTLP API and flattens the nested `resourceLogs` structure into a `FlatLogRecord[]`.
2. The flat records are passed as props to `LogViewerShell`, a client component that owns all interactive state via `useReducer`.
3. The shell derives histogram buckets and optional service groups via `useMemo` and passes them down to the display components.
4. Clicking **Refresh** in `LogViewerToolbar` triggers a client-side fetch that goes through the same transform pipeline and dispatches `SET_RECORDS` to update the state.

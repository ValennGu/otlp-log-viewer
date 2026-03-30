"use client";

import { useReducer, useMemo } from "react";
import { FlatLogRecord } from "@/lib/otlp/types";
import { logViewerReducer, initialState } from "@/lib/state/logViewerReducer";
import { buildHistogramBuckets } from "@/lib/otlp/histogram";
import { groupByService, transformOtlpResponse } from "@/lib/otlp/transform";
import { API_URL } from "@/lib/api/fetchLogs";
import LogViewerToolbar from "./LogViewerToolbar";
import LogHistogram from "./LogHistogram";
import LogTable from "./LogTable";

interface Props {
  initialRecords: FlatLogRecord[];
}

export default function LogViewerShell({ initialRecords }: Props) {
  const [state, dispatch] = useReducer(logViewerReducer, initialState(initialRecords));

  const histogramBuckets = useMemo(
    () => buildHistogramBuckets(state.records),
    [state.records]
  );

  const serviceGroups = useMemo(
    () => (state.groupByService ? groupByService(state.records) : null),
    [state.groupByService, state.records]
  );

  async function handleRefresh() {
    dispatch({ type: "SET_REFRESHING", value: true });
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const records = transformOtlpResponse(await res.json());
      dispatch({ type: "SET_RECORDS", records });
    } catch (e) {
      dispatch({ type: "SET_ERROR", error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      dispatch({ type: "SET_REFRESHING", value: false });
    }
  }

  return (
    <div>
      <LogViewerToolbar
        totalCount={state.records.length}
        groupByService={state.groupByService}
        isRefreshing={state.isRefreshing}
        onToggleGroupBy={() => dispatch({ type: "TOGGLE_GROUP_BY" })}
        onRefresh={handleRefresh}
      />
      {state.error && (
        <div className="mb-4 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          Error: {state.error}
        </div>
      )}
      <div className="mb-4">
        <LogHistogram buckets={histogramBuckets} />
      </div>
      <LogTable
        records={state.records}
        groups={serviceGroups}
        expandedRows={state.expandedRows}
        collapsedGroups={state.collapsedGroups}
        onToggleRow={(id) => dispatch({ type: "TOGGLE_ROW", id })}
        onToggleGroup={(key) => dispatch({ type: "TOGGLE_GROUP", key })}
      />
    </div>
  );
}

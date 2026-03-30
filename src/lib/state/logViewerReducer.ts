import { FlatLogRecord } from "@/lib/otlp/types";

export interface LogViewerState {
  records: FlatLogRecord[];
  groupByService: boolean;
  expandedRows: Set<string>;
  collapsedGroups: Set<string>;
  isRefreshing: boolean;
  error: string | null;
}

export type LogViewerAction =
  | { type: "SET_RECORDS"; records: FlatLogRecord[] }
  | { type: "TOGGLE_GROUP_BY" }
  | { type: "TOGGLE_ROW"; id: string }
  | { type: "TOGGLE_GROUP"; key: string }
  | { type: "SET_REFRESHING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null };

export function initialState(records: FlatLogRecord[]): LogViewerState {
  return {
    records,
    groupByService: false,
    expandedRows: new Set(),
    collapsedGroups: new Set(),
    isRefreshing: false,
    error: null,
  };
}

export function logViewerReducer(
  state: LogViewerState,
  action: LogViewerAction
): LogViewerState {
  switch (action.type) {
    case "SET_RECORDS":
      return { ...state, records: action.records, expandedRows: new Set(), error: null };
    case "TOGGLE_GROUP_BY":
      return { ...state, groupByService: !state.groupByService, collapsedGroups: new Set() };
    case "TOGGLE_ROW": {
      const next = new Set(state.expandedRows);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, expandedRows: next };
    }
    case "TOGGLE_GROUP": {
      const next = new Set(state.collapsedGroups);
      if (next.has(action.key)) next.delete(action.key);
      else next.add(action.key);
      return { ...state, collapsedGroups: next };
    }
    case "SET_REFRESHING":
      return { ...state, isRefreshing: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    default:
      return state;
  }
}

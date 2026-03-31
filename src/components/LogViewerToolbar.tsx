interface Props {
  totalCount: number;
  groupByService: boolean;
  isRefreshing: boolean;
  onToggleGroupBy: () => void;
  onRefresh: () => void;
}

export default function LogViewerToolbar({
  totalCount,
  groupByService,
  isRefreshing,
  onToggleGroupBy,
  onRefresh,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-slate-800">Logs</h1>
        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
          {totalCount.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          role="switch"
          aria-checked={groupByService}
          onClick={onToggleGroupBy}
          className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
            groupByService
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span
            className={`relative inline-block w-8 h-4 rounded-full transition-colors ${
              groupByService ? "bg-blue-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 -ml-3.25 bg-white rounded-full shadow transition-transform ${
                groupByService ? "translate-x-3.5" : ""
              }`}
            />
          </span>
          Group by service
        </button>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}

import { ServiceGroup } from "@/lib/otlp/types";

interface Props {
  group: ServiceGroup;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function LogGroupHeader({ group, isCollapsed, onToggle }: Props) {
  return (
    <tr
      className="bg-slate-100 hover:bg-slate-200 cursor-pointer select-none"
      onClick={onToggle}
    >
      <td colSpan={3} className="px-4 py-2">
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-semibold text-sm text-slate-800">
            {group.serviceName || "(unnamed service)"}
          </span>
          {group.serviceNamespace && (
            <span className="text-xs text-slate-500">{group.serviceNamespace}</span>
          )}
          {group.serviceVersion && (
            <span className="inline-block px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded font-mono">
              {group.serviceVersion}
            </span>
          )}
          <span className="ml-auto inline-block px-2 py-0.5 bg-slate-300 text-slate-700 text-xs rounded-full font-medium">
            {group.records.length}
          </span>
        </div>
      </td>
    </tr>
  );
}

import { FlatLogRecord } from "@/lib/otlp/types";
import { SEVERITY_ROW_CLASSES } from "@/lib/otlp/severity";
import SeverityBadge from "./SeverityBadge";
import LogRecordDetail from "./LogRecordDetail";

interface Props {
  record: FlatLogRecord;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function LogTableRow({ record, isExpanded, onToggle }: Props) {
  const rowClass = SEVERITY_ROW_CLASSES[record.severityLevel] ?? "";
  return (
    <>
      <tr
        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${rowClass}`}
        onClick={onToggle}
      >
        <td className="px-4 py-2 whitespace-nowrap">
          <SeverityBadge level={record.severityLevel} text={record.severityText || record.severityLevel} />
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-xs font-mono text-slate-500">
          {record.timestampDisplay}
        </td>
        <td className="px-4 py-2 text-sm text-slate-700 max-w-xl truncate">
          {record.body}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={3} className="p-0">
            <LogRecordDetail record={record} />
          </td>
        </tr>
      )}
    </>
  );
}

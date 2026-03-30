import { FlatLogRecord, ServiceGroup } from "@/lib/otlp/types";
import LogGroupHeader from "./LogGroupHeader";
import LogTableRow from "./LogTableRow";

interface Props {
  records: FlatLogRecord[];
  groups: ServiceGroup[] | null;
  expandedRows: Set<string>;
  collapsedGroups: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleGroup: (key: string) => void;
}

export default function LogTable({
  records,
  groups,
  expandedRows,
  collapsedGroups,
  onToggleRow,
  onToggleGroup,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
              Severity
            </th>
            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider w-52">
              Time
            </th>
            <th className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Body
            </th>
          </tr>
        </thead>
        <tbody>
          {groups === null ? (
            records.map((record) => (
              <LogTableRow
                key={record.id}
                record={record}
                isExpanded={expandedRows.has(record.id)}
                onToggle={() => onToggleRow(record.id)}
              />
            ))
          ) : (
            groups.map((group) => (
              <>
                <LogGroupHeader
                  key={`group-${group.key}`}
                  group={group}
                  isCollapsed={collapsedGroups.has(group.key)}
                  onToggle={() => onToggleGroup(group.key)}
                />
                {!collapsedGroups.has(group.key) &&
                  group.records.map((record) => (
                    <LogTableRow
                      key={record.id}
                      record={record}
                      isExpanded={expandedRows.has(record.id)}
                      onToggle={() => onToggleRow(record.id)}
                    />
                  ))}
              </>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

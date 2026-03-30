import { FlatLogRecord } from "@/lib/otlp/types";

interface Props {
  record: FlatLogRecord;
}

function AttributePanel({
  title,
  attrs,
}: {
  title: string;
  attrs: Record<string, string>;
}) {
  const entries = Object.entries(attrs);
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </h4>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400 italic">None</p>
      ) : (
        <dl className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <dt className="font-mono text-slate-500 shrink-0 min-w-0 truncate max-w-[40%]">
                {key}
              </dt>
              <dd className="text-slate-800 min-w-0 break-all">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function LogRecordDetail({ record }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-3 bg-slate-50 border-t border-slate-200">
      <AttributePanel title="Log Attributes" attrs={record.attributes} />
      <AttributePanel title="Resource Attributes" attrs={record.resourceAttributes} />
      <AttributePanel title="Scope Attributes" attrs={record.scopeAttributes} />
    </div>
  );
}

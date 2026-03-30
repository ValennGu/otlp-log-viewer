import { Suspense } from "react";
import { fetchAndTransformLogs } from "@/lib/api/fetchLogs";
import LogViewerShell from "@/components/LogViewerShell";

function LogViewerSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-100 rounded w-48" />
      <div className="h-28 bg-slate-100 rounded" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

async function LogViewerContent() {
  const records = await fetchAndTransformLogs();
  return <LogViewerShell initialRecords={records} />;
}

export default function Page() {
  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-6">
      <Suspense fallback={<LogViewerSkeleton />}>
        <LogViewerContent />
      </Suspense>
    </main>
  );
}

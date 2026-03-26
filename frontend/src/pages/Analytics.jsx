import { useQuery } from "react-query";
import { FileText, MessageSquare, HardDrive, TrendingUp, Loader2 } from "lucide-react";
import { analyticsApi } from "../api/client";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4 border-l-4 border-l-indigo-500">
      <div className="bg-indigo-500/20 p-3 rounded-lg">
        <Icon size={18} className="text-indigo-400" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Analytics() {
  const { data: summary, isLoading: loadingSummary } = useQuery("analytics-summary", () =>
    analyticsApi.summary().then((r) => r.data)
  );
  const { data: trending = [], isLoading: loadingTrending } = useQuery("analytics-trending", () =>
    analyticsApi.trending().then((r) => r.data)
  );

  if (loadingSummary) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Track your usage and activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Documents" value={summary?.total_documents ?? 0} />
        <StatCard icon={MessageSquare} label="Total Queries" value={summary?.total_queries ?? 0} />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(summary?.storage_bytes ?? 0)} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-indigo-400" />
          <h2 className="text-sm font-medium text-white">Trending this week</h2>
        </div>
        {loadingTrending ? (
          <Loader2 className="animate-spin text-gray-500" />
        ) : trending.length === 0 ? (
          <p className="text-gray-500 text-sm">No queries this week.</p>
        ) : (
          <div className="space-y-2">
            {trending.map((doc) => (
              <div key={doc.document_id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate">{doc.original_name}</span>
                <span className="text-gray-500 shrink-0 ml-4">{doc.query_count} queries</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

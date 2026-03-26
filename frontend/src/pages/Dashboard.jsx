import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  Upload, MessageSquare, BarChart2, BookOpen,
  FileText, Loader2, ArrowRight, Sparkles,
  ShieldCheck, Search, TrendingUp, Clock,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { documentsApi, analyticsApi } from "../api/client";

const STATUS_COLORS = {
  ready:      "bg-green-500/20 text-green-400",
  processing: "bg-yellow-500/20 text-yellow-400",
  pending:    "bg-gray-500/20 text-gray-400",
  error:      "bg-red-500/20 text-red-400",
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const fileRef = useRef();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const firstName = user?.displayName?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "there";

  const { data: docs = [], isLoading: docsLoading } = useQuery("documents", () =>
    documentsApi.list().then((r) => r.data)
  );

  const { data: summary } = useQuery("analytics-summary", () =>
    analyticsApi.summary().then((r) => r.data)
  );

  const upload = useMutation(
    (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return documentsApi.upload(fd);
    },
    {
      onSuccess: () => {
        qc.invalidateQueries("documents");
        qc.invalidateQueries("analytics-summary");
      },
    }
  );

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  };

  const recentDocs = docs.slice(0, 5);
  const readyDocs = docs.filter((d) => d.status === "ready").length;

  return (
    <div className="space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600/20 via-gray-900 to-gray-900 border border-indigo-500/20 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <p className="text-indigo-400 text-sm font-medium mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold text-white mb-2">
            Hello, {firstName} 👋
          </h1>
          <p className="text-gray-400 mb-6 max-w-lg">
            Analyze and chat with your documents using AI. Upload a file to get started or continue where you left off.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fileRef.current.click()}
              disabled={upload.isLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              {upload.isLoading
                ? <Loader2 size={15} className="animate-spin" />
                : <Upload size={15} />}
              Upload Document
            </button>
            <Link
              to="/app/chat"
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <MessageSquare size={15} />
              Go to Chat
            </Link>
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile}
            accept=".pdf,.txt,.docx,.xlsx" />
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Documents" value={summary?.total_documents ?? docs.length} color="indigo" />
        <StatCard icon={MessageSquare} label="Total Queries" value={summary?.total_queries ?? 0} color="violet" />
        <StatCard icon={ShieldCheck} label="Ready to Chat" value={readyDocs} color="green" />
        <StatCard icon={TrendingUp} label="Storage Used" value={formatBytes(summary?.storage_bytes ?? 0)} color="amber" />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ActionCard
            icon={Upload}
            label="Upload Document"
            desc="Add PDF, DOCX, TXT or XLSX"
            onClick={() => fileRef.current.click()}
            color="indigo"
          />
          <ActionCard
            icon={MessageSquare}
            label="Start Chat"
            desc="Ask questions about your docs"
            to="/app/chat"
            color="violet"
          />
          <ActionCard
            icon={BarChart2}
            label="View Analytics"
            desc="Usage stats and insights"
            to="/app/analytics"
            color="amber"
          />
          <ActionCard
            icon={BookOpen}
            label="My Library"
            desc="Browse all your documents"
            to="/app/library"
            color="green"
          />
        </div>
      </div>

      {/* ── Recent Documents ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent Documents</h2>
          <Link to="/app/library"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {docsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-gray-600" />
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText size={20} className="text-gray-500" />
            </div>
            <p className="text-white text-sm font-medium mb-1">No documents yet</p>
            <p className="text-gray-500 text-xs">Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {recentDocs.map((doc, i) => (
              <Link
                key={doc.id}
                to={`/app/library/${doc.id}`}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-800/60 transition-colors ${
                  i < recentDocs.length - 1 ? "border-b border-gray-800" : ""
                }`}
              >
                <div className="bg-indigo-500/10 p-2 rounded-lg shrink-0">
                  <FileText size={14} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{doc.original_name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {new Date(doc.created_at).toLocaleDateString()} ·{" "}
                    {(doc.size_bytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[doc.status] || STATUS_COLORS.pending}`}>
                  {doc.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Features overview ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Platform Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard icon={MessageSquare} title="AI Chat" desc="Ask anything about your documents and get precise answers with source citations." />
          <FeatureCard icon={Sparkles} title="Summarization" desc="Generate short or detailed summaries of any document in seconds." />
          <FeatureCard icon={Search} title="Semantic Search" desc="Find relevant content across all your documents using vector search." />
          <FeatureCard icon={ShieldCheck} title="AES-256 Encryption" desc="All files encrypted at rest. Your data never leaves your control." />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const COLOR_MAP = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  green:  { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20"  },
  amber:  { bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20"  },
};

function StatCard({ icon: Icon, label, value, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
      <div className={`${c.bg} p-2.5 rounded-lg shrink-0`}>
        <Icon size={16} className={c.text} />
      </div>
      <div>
        <p className="text-xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, label, desc, to, onClick, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  const cls = `group bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/20 cursor-pointer block`;
  const inner = (
    <>
      <div className={`${c.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <Icon size={18} className={c.text} />
      </div>
      <p className="text-sm font-medium text-white mb-1">{label}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={`${cls} text-left w-full`}>{inner}</button>;
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="bg-indigo-500/10 w-9 h-9 rounded-lg flex items-center justify-center mb-3">
        <Icon size={16} className="text-indigo-400" />
      </div>
      <p className="text-sm font-medium text-white mb-1">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

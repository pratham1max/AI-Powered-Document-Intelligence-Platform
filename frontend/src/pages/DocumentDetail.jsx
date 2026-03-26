import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Download, Trash2, Tag, Loader2, ChevronRight } from "lucide-react";
import { documentsApi } from "../api/client";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: doc, isLoading } = useQuery(["document", id], () =>
    documentsApi.get(id).then((r) => r.data)
  );

  const deleteMutation = useMutation(() => documentsApi.delete(id), {
    onSuccess: () => {
      qc.invalidateQueries("documents");
      navigate("/app/library");
    },
  });

  const handleDownload = async () => {
    const res = await documentsApi.download(id);
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.original_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-gray-500" />
      </div>
    );
  }
  if (!doc) return <p className="text-gray-500">Document not found.</p>;

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
        <Link to="/app/library" className="hover:text-white transition-colors">Library</Link>
        <ChevronRight size={14} />
        <span className="text-gray-300 truncate">{doc.original_name}</span>
      </div>

      <h1 className="text-2xl font-semibold text-white mb-1">{doc.original_name}</h1>
      <p className="text-gray-400 text-sm mb-6">{new Date(doc.created_at).toLocaleDateString()}</p>

      {/* Metadata card grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <MetaItem label="Status" value={doc.status} />
          <MetaItem label="Size" value={`${(doc.size_bytes / 1024).toFixed(1)} KB`} />
          <MetaItem label="Type" value={doc.mime_type} />
          <MetaItem label="Uploaded" value={new Date(doc.created_at).toLocaleDateString()} />
        </div>
      </div>

      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {doc.tags.map((t) => (
            <span
              key={t.label}
              className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full"
            >
              <Tag size={10} /> {t.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Download size={14} /> Download
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {deleteMutation.isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          Delete
        </button>
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}

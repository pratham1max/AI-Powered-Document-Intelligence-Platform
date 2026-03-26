import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { Upload, FileText, Loader2 } from "lucide-react";
import { documentsApi } from "../api/client";

const STATUS_COLORS = {
  ready: "bg-green-500/20 text-green-400",
  processing: "bg-yellow-500/20 text-yellow-400",
  pending: "bg-gray-500/20 text-gray-400",
  error: "bg-red-500/20 text-red-400",
};

export default function Library() {
  const fileRef = useRef();
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useQuery("documents", () =>
    documentsApi.list().then((r) => r.data)
  );

  const upload = useMutation(
    (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return documentsApi.upload(fd);
    },
    { onSuccess: () => qc.invalidateQueries("documents") }
  );

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) upload.mutate(file);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Library</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and search your documents</p>
        </div>
        <button
          onClick={() => fileRef.current.click()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {upload.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile}
          accept=".pdf,.txt,.docx,.xlsx" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-500" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-gray-800 p-4 rounded-full mb-4">
            <Upload size={24} className="text-gray-500" />
          </div>
          <p className="text-white font-medium mb-1">No documents yet</p>
          <p className="text-gray-500 text-sm">Upload a PDF, DOCX, TXT, or XLSX to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              to={`/library/${doc.id}`}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-3 transition-all hover:shadow-lg hover:shadow-black/20"
            >
              <FileText size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{doc.original_name}</p>
                <p className="text-xs text-gray-500">{(doc.size_bytes / 1024).toFixed(1)} KB</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[doc.status] || STATUS_COLORS.pending}`}>
                {doc.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

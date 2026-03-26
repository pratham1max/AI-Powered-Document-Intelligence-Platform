import { useState } from "react";
import { useQuery } from "react-query";
import { Send, Loader2, MessagesSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { documentsApi, queryApi } from "../api/client";

export default function Chat() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: docs = [] } = useQuery("documents", () =>
    documentsApi.list().then((r) => r.data)
  );

  const toggleDoc = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSend = async () => {
    if (!question.trim() || selectedIds.length === 0) return;
    const q = question;
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const { data } = await queryApi.query({ document_ids: selectedIds, question: q });
      setMessages((m) => [...m, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Chat with Documents</h1>
        <p className="text-gray-400 text-sm mt-1">Select documents and ask questions</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        <aside className="w-56 shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-y-auto flex flex-col">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Select Documents</p>
          <div className="space-y-1 flex-1">
            {docs.filter((d) => d.status === "ready").length === 0 ? (
              <p className="text-gray-600 text-xs">No ready documents.</p>
            ) : (
              docs
                .filter((d) => d.status === "ready")
                .map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors truncate ${
                      selectedIds.includes(doc.id)
                        ? "bg-indigo-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {doc.original_name}
                  </button>
                ))
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="bg-gray-800 p-4 rounded-full mb-3">
                  <MessagesSquare size={22} className="text-gray-500" />
                </div>
                <p className="text-gray-500 text-sm">
                  Select documents on the left, then ask a question.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-100"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.sources?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Sources:{" "}
                      {msg.sources
                        .map((s) => `Doc ${s.document_id} chunk ${s.chunk_index}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-xl px-4 py-3">
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 p-3 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={selectedIds.length === 0 ? "Select documents first..." : "Ask a question..."}
              disabled={selectedIds.length === 0}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!question.trim() || selectedIds.length === 0 || loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DocumentViewer — renders document text content with [[ENC:...]] tokens
 * displayed as redacted blocks (████) with hover tooltip and lock icon.
 * Actual tokens are never shown to the user.
 */
import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { fileOpsApi } from "../api/client";

// Regex to find [[ENC:...]] tokens
const ENC_REGEX = /(\[\[ENC:[A-Za-z0-9_=-]+\]\])/g;

export default function DocumentViewer({ content, docId, onContentChange }) {
  if (!content) return null;

  // Split content into segments: plain text and encrypted tokens
  const segments = content.split(ENC_REGEX);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white">Document Preview</p>
        <span className="text-xs text-gray-500">
          {(content.match(ENC_REGEX) || []).length} encrypted block(s)
        </span>
      </div>
      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono bg-gray-950 rounded-lg p-4 max-h-96 overflow-y-auto">
        {segments.map((seg, i) =>
          ENC_REGEX.test(seg)
            ? <RedactedBlock key={i} token={seg} docId={docId} onDecrypted={(plain) => {
                const newContent = content.replace(seg, plain);
                onContentChange?.(newContent);
              }} />
            : <span key={i}>{seg}</span>
        )}
      </div>
    </div>
  );
}

function RedactedBlock({ token, docId, onDecrypted }) {
  const [revealed, setRevealed] = useState(false);
  const [plaintext, setPlaintext] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    if (plaintext) {
      setRevealed(true);
      return;
    }
    setLoading(true);
    try {
      const { data } = await fileOpsApi.decryptText(token);
      setPlaintext(data.text);
      setRevealed(true);
    } catch {
      // wrong user or invalid token
    } finally {
      setLoading(false);
    }
  };

  if (revealed && plaintext) {
    return (
      <span className="relative inline-flex items-center gap-1">
        <span className="bg-green-500/20 text-green-300 px-1 rounded">{plaintext}</span>
        <button onClick={() => setRevealed(false)} title="Hide" className="text-gray-500 hover:text-white">
          <EyeOff size={11} />
        </button>
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-pointer group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleReveal}
    >
      {/* Redacted block */}
      <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-700 select-none px-1.5 py-0.5 rounded font-mono tracking-widest hover:bg-gray-600 transition-colors">
        {loading
          ? <Loader2 size={11} className="animate-spin text-gray-400" />
          : <><Lock size={10} className="text-gray-400" /><span>████████</span></>
        }
      </span>
      {/* Tooltip */}
      {showTooltip && (
        <span className="absolute -top-7 left-0 bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
          🔒 Encrypted — click to reveal
        </span>
      )}
      {/* Eye icon on hover */}
      <Eye size={11} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
    </span>
  );
}

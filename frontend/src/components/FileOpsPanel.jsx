/**
 * FileOpsPanel — shown on DocumentDetail page.
 * Provides: selective text encrypt/decrypt, file lock/unlock, format conversion.
 */
import { useState } from "react";
import {
  Lock, Unlock, RefreshCw, ShieldCheck, ShieldOff,
  Copy, Check, Loader2, ChevronDown, ChevronUp, Archive,
} from "lucide-react";
import { fileOpsApi } from "../api/client";

export default function FileOpsPanel({ doc, onStatusChange }) {
  const [section, setSection] = useState(null);
  const isPdf = doc?.mime_type === "application/pdf";

  const toggle = (s) => setSection((prev) => (prev === s ? null : s));

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-gray-800/40 border-b border-gray-800">
        <p className="text-sm font-medium text-white">File Operations</p>
        <p className="text-xs text-gray-500 mt-0.5">Encrypt text, lock file, or convert format</p>
      </div>

      {/* Text Encryption */}
      <Section
        icon={ShieldCheck}
        label="Selective Text Encryption"
        open={section === "text"}
        onToggle={() => toggle("text")}
        disabled={isPdf}
        disabledHint="Convert PDF to DOCX or TXT first"
      >
        <TextEncryptSection doc={doc} />
      </Section>

      {/* Lock / Unlock */}
      <Section
        icon={doc?.status === "locked" ? Unlock : Lock}
        label={doc?.status === "locked" ? "Unlock Document" : "Lock Document"}
        open={section === "lock"}
        onToggle={() => toggle("lock")}
        accent={doc?.status === "locked" ? "amber" : "default"}
      >
        <LockSection doc={doc} onStatusChange={onStatusChange} />
      </Section>

      {/* Secure Download */}
      <Section
        icon={ShieldCheck}
        label="Download Protected"
        open={section === "protected"}
        onToggle={() => toggle("protected")}
        disabled={doc?.status === "locked"}
        disabledHint="Unlock document first"
      >
        <ProtectedDownloadSection doc={doc} />
      </Section>

      {/* ZIP Download */}
      <Section
        icon={Archive}
        label="Download as ZIP"
        open={section === "zip"}
        onToggle={() => toggle("zip")}
        disabled={doc?.status === "locked"}
        disabledHint="Unlock document first"
      >
        <ZipDownloadSection doc={doc} />
      </Section>

      {/* Convert */}
      <Section
        icon={RefreshCw}
        label="Convert Format"
        open={section === "convert"}
        onToggle={() => toggle("convert")}
        disabled={doc?.status === "locked"}
        disabledHint="Unlock document first"
      >
        <ConvertSection doc={doc} />
      </Section>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, label, open, onToggle, children, accent, disabled, disabledHint }) {
  const accentClass = accent === "amber" ? "text-amber-400" : "text-indigo-400";
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
          disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-800/40"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className={accentClass} />
          <span className="text-sm text-white">{label}</span>
          {disabled && <span className="text-xs text-gray-600">({disabledHint})</span>}
        </div>
        {open ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

// ── Text Encryption ───────────────────────────────────────────────────────────

function TextEncryptSection({ doc }) {
  const [mode, setMode] = useState("encrypt"); // "encrypt" | "decrypt"
  const [text, setText] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState("input"); // "input" | "preview" | "done"
  const [preview, setPreview] = useState({ token: "", plaintext: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const reset = () => { setText(""); setToken(""); setStep("input"); setPreview({}); setError(""); };

  // Step 1: Generate token
  const handleGenerate = async () => {
    if (!text.trim()) return;
    setError(""); setLoading(true);
    try {
      const { data } = await fileOpsApi.encryptText(text);
      setPreview({ token: data.token, plaintext: text });
      setStep("preview");
    } catch (e) {
      setError(e.response?.data?.detail || "Encryption failed");
    } finally { setLoading(false); }
  };

  // Step 2: Apply to document
  const handleApply = async () => {
    if (!doc?.id) return;
    setError(""); setLoading(true);
    try {
      await fileOpsApi.applyEncryption(doc.id, preview.plaintext, preview.token);
      setStep("done");
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to apply to document");
    } finally { setLoading(false); }
  };

  // Decrypt: find token in doc and restore plaintext
  const handleDecryptApply = async () => {
    if (!token.trim() || !doc?.id) return;
    setError(""); setLoading(true);
    try {
      const { data } = await fileOpsApi.decryptText(token);
      await fileOpsApi.applyDecryption(doc.id, token, data.text);
      setStep("done");
    } catch (e) {
      setError(e.response?.data?.detail || "Decryption failed");
    } finally { setLoading(false); }
  };

  const copy = (val) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-2">
        {["encrypt", "decrypt"].map((m) => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            className={`text-xs px-3 py-1 rounded-lg transition-colors capitalize ${
              mode === m ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}>
            {m}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* ── Encrypt flow ── */}
      {mode === "encrypt" && (
        <>
          {step === "input" && (
            <>
              <p className="text-xs text-gray-500">Enter the exact text from your document to encrypt.</p>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="e.g. cell, confidential info, secret key..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
              <button onClick={handleGenerate} disabled={loading || !text.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                Generate Encrypted Token
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 space-y-2">
                <p className="text-xs text-gray-500">Original text:</p>
                <p className="text-xs text-white font-mono bg-gray-900 px-2 py-1 rounded">{preview.plaintext}</p>
                <p className="text-xs text-gray-500 mt-2">Will be replaced with:</p>
                <div className="flex items-start gap-2">
                  <p className="text-xs text-green-400 font-mono bg-gray-900 px-2 py-1 rounded flex-1 break-all">{preview.token}</p>
                  <button onClick={() => copy(preview.token)} className="text-gray-500 hover:text-white shrink-0 mt-1">
                    {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-amber-400">⚠ This will permanently modify the stored document.</p>
              <div className="flex gap-2">
                <button onClick={handleApply} disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                  Apply to Document
                </button>
                <button onClick={reset} className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-400 text-xs font-medium">✓ Encryption applied to document</p>
              <p className="text-gray-500 text-xs mt-1">Download the document to see the encrypted content.</p>
              <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors">
                Encrypt another text
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Decrypt flow ── */}
      {mode === "decrypt" && (
        <>
          {step === "input" && (
            <>
              <p className="text-xs text-gray-500">Paste the <code className="text-indigo-400">[[ENC:...]]</code> token from your document to restore the original text.</p>
              <textarea value={token} onChange={(e) => setToken(e.target.value)}
                placeholder="[[ENC:...]]"
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none font-mono" />
              <button onClick={handleDecryptApply} disabled={loading || !token.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                Decrypt &amp; Apply to Document
              </button>
            </>
          )}

          {step === "done" && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-400 text-xs font-medium">✓ Decryption applied to document</p>
              <p className="text-gray-500 text-xs mt-1">The original text has been restored in the document.</p>
              <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors">
                Decrypt another token
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Lock / Unlock ─────────────────────────────────────────────────────────────

function LockSection({ doc, onStatusChange }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLocked = doc?.status === "locked";

  const handle = async () => {
    if (!password.trim()) return;
    setError(""); setLoading(true);
    try {
      if (isLocked) {
        await fileOpsApi.unlock(doc.id, password);
      } else {
        await fileOpsApi.lock(doc.id, password);
      }
      setPassword("");
      onStatusChange?.();
    } catch (e) {
      setError(e.response?.data?.detail || "Operation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {isLocked
          ? "Enter the password to unlock this document."
          : "Set a password to restrict access to this document."}
      </p>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder={isLocked ? "Enter unlock password" : "Set lock password"}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handle} disabled={loading || !password.trim()}
        className={`flex items-center gap-2 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors ${
          isLocked ? "bg-amber-600 hover:bg-amber-500" : "bg-red-600/80 hover:bg-red-600"
        }`}>
        {loading ? <Loader2 size={12} className="animate-spin" /> : isLocked ? <Unlock size={12} /> : <Lock size={12} />}
        {isLocked ? "Unlock Document" : "Lock Document"}
      </button>
    </div>
  );
}

// ── Protected Download ────────────────────────────────────────────────────────

function ProtectedDownloadSection({ doc }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!password.trim()) return;
    setError(""); setLoading(true);
    try {
      const res = await fileOpsApi.downloadProtected(doc.id, password);
      const isPdf = doc.mime_type === "application/pdf";
      const ext = isPdf ? "" : "_protected.zip";
      const name = isPdf ? doc.original_name : `${doc.original_name.replace(/\.[^.]+$/, "")}${ext}`;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
      setPassword("");
    } catch (e) {
      setError(e.response?.data?.detail || "Download failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {doc?.mime_type === "application/pdf"
          ? "Download as a password-protected PDF (like Aadhaar). Requires password to open."
          : "Download as a password-protected ZIP file."}
      </p>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Set download password"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handle} disabled={loading || !password.trim()}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
        {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
        Download Protected
      </button>
    </div>
  );
}

// ── ZIP Download ──────────────────────────────────────────────────────────────

function ZipDownloadSection({ doc }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fileOpsApi.downloadZip([doc.id], password);
      const name = password ? "documents_protected.zip" : "documents.zip";
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
      setPassword("");
    } catch (e) {
      setError(e.response?.data?.detail || "ZIP creation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Package this document into a ZIP file. Add a password for AES-256 encrypted ZIP.
      </p>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="ZIP password (optional)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button onClick={handle} disabled={loading}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors border border-gray-600">
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
        {password ? "Download Encrypted ZIP" : "Download as ZIP"}
      </button>
    </div>
  );
}

// ── Conversion ────────────────────────────────────────────────────────────────

const CONVERSIONS = {
  "application/pdf": [{ label: "PDF → DOCX", format: "docx" }],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    { label: "DOCX → PDF", format: "pdf" },
    { label: "DOCX → TXT", format: "txt" },
  ],
  "text/plain": [{ label: "TXT → PDF", format: "pdf" }],
};

function ConvertSection({ doc }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const options = CONVERSIONS[doc?.mime_type] || [];

  const handleConvert = async (format, label) => {
    setError(""); setLoading(format);
    try {
      const res = await fileOpsApi.convert(doc.id, format);
      const ext = format;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.original_name.replace(/\.[^.]+$/, "")}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.detail || "Conversion failed");
    } finally { setLoading(null); }
  };

  if (options.length === 0) {
    return <p className="text-xs text-gray-500">No conversions available for this file type.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">Download a converted copy of this document.</p>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(({ label, format }) => (
          <button key={format} onClick={() => handleConvert(format, label)}
            disabled={!!loading}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors border border-gray-700">
            {loading === format ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

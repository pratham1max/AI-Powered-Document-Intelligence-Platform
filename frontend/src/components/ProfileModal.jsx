import { useState, useEffect } from "react";
import { X, ShieldCheck, ShieldOff, Copy, Check, Loader2, User } from "lucide-react";
import QRCode from "qrcode";
import { auth } from "../firebase/config";
import { twoFaApi } from "../api/client";

export default function ProfileModal({ onClose }) {
  const user = auth.currentUser;
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState("idle"); // idle | setup | verify
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load current 2FA status
  useEffect(() => {
    twoFaApi.status().then((r) => setEnabled(r.data.enabled)).catch(() => {});
  }, []);

  // ── Enable: generate QR ───────────────────────────────────────────────────
  const handleSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await twoFaApi.setup();
      // Generate QR locally — no external requests
      const qrDataUrl = await QRCode.toDataURL(data.qr_code, { width: 160, margin: 1 });
      setQrCode(qrDataUrl);
      setSecret(data.secret);
      setStep("setup");
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP to finalize enable ─────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await twoFaApi.verify(otp);
      setEnabled(true);
      setStep("idle");
      setOtp("");
      setQrCode("");
      setSecret("");
    } catch (e) {
      setError(e.response?.data?.detail || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Disable ───────────────────────────────────────────────────────────────
  const handleDisable = async () => {
    setError("");
    setLoading(true);
    try {
      await twoFaApi.disable();
      setEnabled(false);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <User size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.email || "—"}</p>
              <p className="text-gray-500 text-xs">UID: {user?.uid?.slice(0, 16)}…</p>
            </div>
          </div>

          {/* 2FA section */}
          <div className="border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {enabled
                  ? <ShieldCheck size={16} className="text-green-400" />
                  : <ShieldOff size={16} className="text-gray-500" />}
                <span className="text-sm font-medium text-white">Two-Factor Authentication</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${enabled ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              {enabled
                ? "Your account is protected with Google Authenticator."
                : "Secure your account with Google Authenticator or Authy."}
            </p>

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            {/* Idle */}
            {step === "idle" && (
              enabled ? (
                <button onClick={handleDisable} disabled={loading}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldOff size={13} />}
                  Disable 2FA
                </button>
              ) : (
                <button onClick={handleSetup} disabled={loading}
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Enable 2FA
                </button>
              )
            )}

            {/* QR setup */}
            {step === "setup" && (
              <div className="space-y-4">
                <p className="text-gray-400 text-xs">
                  Scan with <span className="text-white">Google Authenticator</span> or <span className="text-white">Authy</span>:
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-2 rounded-lg">
                    <img src={qrCode} alt="TOTP QR Code" width={160} height={160} />
                  </div>
                </div>
                {/* Manual key */}
                <div>
                  <p className="text-gray-500 text-xs mb-1">Or enter manually:</p>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                    <code className="flex-1 text-xs text-gray-300 break-all font-mono">{secret}</code>
                    <button onClick={copySecret} className="text-gray-500 hover:text-white shrink-0 transition-colors">
                      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-xs">Enter the 6-digit code to confirm:</p>
                <form onSubmit={handleVerify} className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white text-center tracking-[0.4em] placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    autoFocus
                    required
                  />
                  <button type="submit" disabled={loading || otp.length < 6}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-sm transition-colors flex items-center gap-1">
                    {loading ? <Loader2 size={13} className="animate-spin" /> : "Verify"}
                  </button>
                </form>
                <button onClick={() => { setStep("idle"); setError(""); }}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

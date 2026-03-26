import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Loader2, ShieldCheck, Copy, Check } from "lucide-react";
import { registerWithEmail, loginWithGoogle } from "../firebase/authService";
import { twoFaApi } from "../api/client";

const STEP = { FORM: "form", MFA_SETUP: "mfa_setup", DONE: "done" };

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP.FORM);
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");

  const handleError = (err) => {
    const msg = {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-email": "Invalid email address.",
    }[err.code] || err.message;
    setError(msg);
  };

  // After Firebase account created, call backend to generate TOTP QR
  const beginMfaSetup = async () => {
    const { data } = await twoFaApi.setup();
    setQrCode(data.qr_code);
    setSecret(data.secret);
    setStep(STEP.MFA_SETUP);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await registerWithEmail(form.email, form.password);
      await beginMfaSetup();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      await beginMfaSetup();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP with backend to finalize 2FA enrollment
  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await twoFaApi.verify(otp);
      setStep(STEP.DONE);
      setTimeout(() => navigate("/app/library"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Done screen ───────────────────────────────────────────────────────────
  if (step === STEP.DONE) {
    return (
      <AuthCard>
        <div className="text-center py-4">
          <div className="flex justify-center mb-4">
            <div className="bg-green-500/20 p-4 rounded-full">
              <ShieldCheck size={28} className="text-green-400" />
            </div>
          </div>
          <p className="text-white font-medium">You're all set</p>
          <p className="text-gray-500 text-sm mt-1">2FA enabled. Redirecting...</p>
        </div>
      </AuthCard>
    );
  }

  // ── MFA setup screen ──────────────────────────────────────────────────────
  if (step === STEP.MFA_SETUP) {
    return (
      <AuthCard title="Set up two-factor authentication">
        <p className="text-gray-400 text-sm mb-5">
          Scan with <span className="text-white">Google Authenticator</span> or <span className="text-white">Authy</span>, then enter the 6-digit code.
        </p>
        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-xl">
            <img src={qrCode} alt="TOTP QR Code" width={160} height={160} />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-5">
          <code className="flex-1 text-xs text-gray-300 break-all font-mono">{secret}</code>
          <button onClick={copySecret} className="text-gray-500 hover:text-white transition-colors shrink-0">
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleMfaVerify} className="space-y-3">
          <input
            type="text" inputMode="numeric" maxLength={6}
            placeholder="000000" value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white text-center tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            autoFocus required
          />
          <SubmitButton loading={loading}>
            <ShieldCheck size={14} /> Enable 2FA
          </SubmitButton>
        </form>
        <button onClick={() => navigate("/app/library")}
          className="w-full text-center text-xs text-gray-600 hover:text-gray-400 mt-3 transition-colors">
          Skip for now (not recommended)
        </button>
      </AuthCard>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <AuthCard title="Create account">
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <button onClick={handleGoogleRegister} disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 mb-4">
        <GoogleIcon />
        Continue with Google
      </button>
      <Divider />
      <form onSubmit={handleRegister} className="space-y-3">
        <input type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required />
        <input type="password" placeholder="Password (min 6 characters)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required />
        <input type="password" placeholder="Confirm password" value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <p className="text-gray-500 text-sm mt-4 text-center">
        Have an account?{" "}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
      </p>
      <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-gray-800">
        <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</a>
        <span className="text-gray-700 text-xs">·</span>
        <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</a>
      </div>
    </AuthCard>
  );
}

function AuthCard({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-xl p-8 border border-gray-800">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={18} className="text-indigo-400" />
          <span className="text-white font-semibold text-base">DocIntel</span>
        </div>
        {title && <h1 className="text-xl font-semibold text-white mb-6">{title}</h1>}
        {children}
      </div>
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
      {loading ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-800" />
      <span className="text-xs text-gray-600">or</span>
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

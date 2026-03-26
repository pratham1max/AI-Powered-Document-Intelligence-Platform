import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, FileText, Loader2, ShieldCheck } from "lucide-react";
import { loginWithEmail, loginWithGoogle } from "../firebase/authService";
import { twoFaApi } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);

  const handleError = (err) => {
    const msg = {
      "auth/invalid-credential": "Invalid email or password.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
    }[err.code] || err.message;
    setError(msg);
  };

  const checkAndProceed = async () => {
    try {
      const { data } = await twoFaApi.status();
      if (data.enabled) {
        setNeeds2fa(true);
      } else {
        navigate("/app");
      }
    } catch {
      navigate("/app");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(form.email, form.password);
      await checkAndProceed();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      await checkAndProceed();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await twoFaApi.validateLogin(otp);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (needs2fa) {
    return (
      <AuthCard title="Two-factor authentication">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-500/20 p-3 rounded-full">
            <ShieldCheck size={24} className="text-indigo-400" />
          </div>
        </div>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter the 6-digit code from your authenticator app.
        </p>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleOtpVerify} className="space-y-4">
          <input
            type="text" inputMode="numeric" maxLength={6} placeholder="000000"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-center text-lg tracking-[0.6em] placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            autoFocus required
          />
          <SubmitButton loading={loading}>Verify</SubmitButton>
        </form>
        <button onClick={() => { setNeeds2fa(false); setOtp(""); setError(""); }}
          className="w-full text-center text-xs text-gray-600 hover:text-gray-400 mt-3 transition-colors">
          Back to sign in
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Sign in">
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <button onClick={handleGoogleLogin} disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 mb-4">
        <GoogleIcon />
        Continue with Google
      </button>
      <Divider />
      <form onSubmit={handleEmailLogin} className="space-y-3">
        <input type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required />
        <input type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required />
        <SubmitButton loading={loading}><LogIn size={14} /> Sign in</SubmitButton>
      </form>
      <p className="text-gray-500 text-sm mt-4 text-center">
        No account?{" "}
        <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Register</Link>
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
        <h1 className="text-xl font-semibold text-white mb-6">{title}</h1>
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

import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import Footer from "./Footer";

export default function LegalLayout({ children }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const homeLink = user ? "/app" : "/";

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Navbar */}
      <nav className="w-full bg-gray-900 border-b border-gray-800 px-6 h-14 flex items-center justify-between shrink-0">
        <Link to={homeLink} className="flex items-center gap-2">
          <FileText size={18} className="text-indigo-400" />
          <span className="text-white font-semibold text-base tracking-tight">DocIntel</span>
        </Link>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </nav>

      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>

      <Footer />
    </div>
  );
}

import { X, Check } from "lucide-react";
import { useThemeStore } from "../store/themeStore";

const THEME_PREVIEWS = {
  dark: { bg: "#030712", nav: "#111827", accent: "#6366f1", label: "Dark" },
  light: { bg: "#f9fafb", nav: "#ffffff", accent: "#6366f1", label: "Light" },
  midnight: { bg: "#020617", nav: "#0f172a", accent: "#818cf8", label: "Midnight" },
};

export default function PreferencesModal({ onClose }) {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Preferences</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Theme */}
          <div>
            <p className="text-sm font-medium text-white mb-1">Theme</p>
            <p className="text-xs text-gray-500 mb-4">Choose how DocIntel looks for you.</p>

            <div className="grid grid-cols-3 gap-3">
              {Object.entries(THEME_PREVIEWS).map(([key, preview]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    theme === key ? "border-indigo-500" : "border-gray-700 hover:border-gray-500"
                  }`}
                >
                  {/* Mini preview */}
                  <div style={{ background: preview.bg }} className="h-16 w-full">
                    {/* Fake navbar */}
                    <div style={{ background: preview.nav }} className="h-4 w-full border-b border-white/10" />
                    {/* Fake content lines */}
                    <div className="p-2 space-y-1.5">
                      <div style={{ background: preview.accent, opacity: 0.7 }} className="h-1.5 w-3/4 rounded-full" />
                      <div style={{ background: preview.nav }} className="h-1.5 w-1/2 rounded-full opacity-60" />
                    </div>
                  </div>

                  {/* Label */}
                  <div style={{ background: preview.nav }} className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: preview.bg === "#f9fafb" ? "#111827" : "#fff" }}>
                      {preview.label}
                    </span>
                    {theme === key && <Check size={11} className="text-indigo-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Future preferences placeholder */}
          <div className="border border-gray-800 rounded-xl p-4 opacity-50">
            <p className="text-sm font-medium text-white mb-1">Language</p>
            <p className="text-xs text-gray-500">English (coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

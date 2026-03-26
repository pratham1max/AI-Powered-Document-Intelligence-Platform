import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FileText, Settings, User, SlidersHorizontal, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import ProfileModal from "./ProfileModal";
import PreferencesModal from "./PreferencesModal";

export default function Navbar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null); // "profile" | "preferences" | null
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  const openModal = (name) => {
    setDropdownOpen(false);
    setModal(name);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium pb-0.5 transition-colors ${
      isActive
        ? "text-white border-b-2 border-indigo-500"
        : "text-gray-400 hover:text-white border-b-2 border-transparent"
    }`;

  return (
    <>
      <nav className="w-full bg-gray-900 border-b border-gray-800 px-6 h-14 flex items-center justify-between shrink-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-indigo-400" />
          <span className="text-white font-semibold text-base tracking-tight">DocIntel</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <NavLink to="/app/library" className={navLinkClass}>Library</NavLink>
          <NavLink to="/app/chat" className={navLinkClass}>Chat</NavLink>
          <NavLink to="/app/analytics" className={navLinkClass}>Analytics</NavLink>
        </div>

        {/* Settings dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <button
                onClick={() => openModal("profile")}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <User size={14} /> Profile
              </button>
              <button
                onClick={() => openModal("preferences")}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <SlidersHorizontal size={14} /> Preferences
              </button>
              <div className="border-t border-gray-800" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}
      {modal === "preferences" && <PreferencesModal onClose={() => setModal(null)} />}
    </>
  );
}

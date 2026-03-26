import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        {/* Left */}
        <p className="text-gray-500">© 2025 DocIntel. All rights reserved.</p>

        {/* Center */}
        <div className="flex items-center gap-5">
          <Link to="/privacy-policy" className="text-gray-500 hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-gray-500 hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link to="/contact" className="text-gray-500 hover:text-white transition-colors">
            Contact
          </Link>
        </div>

        {/* Right */}
        <p className="text-gray-500">
          Developed by{" "}
          <a
            href="https://github.com/pratham1max"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            pratham1max
          </a>
        </p>
      </div>
    </footer>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        {/* Left */}
        <p className="text-gray-500">© 2025 DocIntel. All rights reserved.</p>

        {/* Center */}
        <div className="flex items-center gap-5">
          <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="text-gray-500 hover:text-white transition-colors">Contact</a>
        </div>

        {/* Right */}
        <p className="text-gray-500">Built with AI · Secured with AES-256</p>
      </div>
    </footer>
  );
}

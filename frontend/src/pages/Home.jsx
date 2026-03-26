import { Link } from "react-router-dom";
import { MessageSquare, Sparkles, Shield, Upload, Cpu, MessagesSquare } from "lucide-react";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-3xl">
          Your Documents,{" "}
          <span className="text-indigo-400">Intelligently Understood</span>
        </h1>
        <p className="mt-5 text-gray-400 text-lg max-w-xl">
          Upload any document and instantly ask questions, get summaries, and extract insights — powered by AI.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Get Started
          </Link>
          <Link to="/app/library"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            View Library
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-semibold text-white text-center mb-12">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureCard
            icon={MessageSquare}
            title="AI-Powered Q&A"
            description="Ask anything about your documents and get precise answers with source citations."
          />
          <FeatureCard
            icon={Sparkles}
            title="Smart Summaries"
            description="Get short or detailed summaries of any document in seconds."
          />
          <FeatureCard
            icon={Shield}
            title="Secure by Default"
            description="All files encrypted with AES-256-GCM. Your data never leaves your control."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-gray-900 border-y border-gray-800">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-2xl font-semibold text-white text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Step
              number={1}
              icon={Upload}
              title="Upload"
              description="Drag and drop any PDF, DOCX, TXT, or XLSX file."
            />
            <Step
              number={2}
              icon={Cpu}
              title="Process"
              description="AI extracts, chunks, and indexes your document automatically."
            />
            <Step
              number={3}
              icon={MessagesSquare}
              title="Ask"
              description="Chat with your document, get summaries, search across files."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Join thousands of users who trust DocIntel for their document intelligence needs.
        </p>
        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors"
        >
          Start for Free
        </Link>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="bg-indigo-500/20 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
        <Icon size={18} className="text-indigo-400" />
      </div>
      <h3 className="text-white font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm mb-4">
        {number}
      </div>
      <Icon size={20} className="text-indigo-400 mb-3" />
      <h3 className="text-white font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

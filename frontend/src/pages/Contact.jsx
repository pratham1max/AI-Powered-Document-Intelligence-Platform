import { Mail, Github, ExternalLink } from "lucide-react";
import LegalLayout from "../components/LegalLayout";

export default function Contact() {
  return (
    <LegalLayout>
      <h1 className="text-2xl font-bold text-white mb-2">Contact</h1>
      <p className="text-gray-500 text-sm mb-10">Get in touch with the developer.</p>

      <div className="space-y-4 mb-10">
        <ContactCard
          icon={Mail}
          label="Email"
          value="pratham.prajapati@outlook.com"
          href="mailto:pratham.prajapati@outlook.com"
        />
        <ContactCard
          icon={Github}
          label="GitHub"
          value="github.com/pratham1max"
          href="https://github.com/pratham1max"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-1">About this project</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          DocIntel is an AI-powered document intelligence platform built with FastAPI, React, Firebase, and Google Gemini.
          Developed by <span className="text-indigo-400">pratham1max</span>.
        </p>
        <a
          href="https://github.com/pratham1max/AI-Powered-Document-Intelligence-Platform"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View on GitHub <ExternalLink size={11} />
        </a>
      </div>
    </LegalLayout>
  );
}

function ContactCard({ icon: Icon, label, value, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-4 transition-all group"
    >
      <div className="bg-indigo-500/10 p-2.5 rounded-lg shrink-0">
        <Icon size={16} className="text-indigo-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-white group-hover:text-indigo-300 transition-colors">{value}</p>
      </div>
    </a>
  );
}

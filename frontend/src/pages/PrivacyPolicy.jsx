import { Shield } from "lucide-react";
import LegalLayout from "../components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/20 p-2.5 rounded-lg">
          <Shield size={20} className="text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">Last updated: March 2025</p>

      <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
        <Section title="1. Information We Collect">
          We collect information you provide directly, including your email address when you register, documents you upload, and queries you submit. We also collect usage data such as login timestamps and feature interactions.
        </Section>
        <Section title="2. How We Use Your Information">
          Your information is used solely to provide the DocIntel service — processing your documents, generating AI responses, and maintaining your account. We do not sell or share your data with third parties.
        </Section>
        <Section title="3. Document Security">
          All uploaded documents are encrypted at rest using AES-256-GCM encryption with per-user keys derived via PBKDF2. Encrypted files are stored on secure servers and are only decrypted in memory when you request access.
        </Section>
        <Section title="4. AI Processing">
          Document content is sent to Google Gemini API for AI processing. Text is transmitted securely over HTTPS. We do not store your document content on third-party AI servers beyond the duration of a single request.
        </Section>
        <Section title="5. Authentication">
          Authentication is handled by Firebase (Google). We store only your Firebase UID and email address in our database. Passwords are never stored by DocIntel.
        </Section>
        <Section title="6. Data Retention">
          Your documents and account data are retained until you delete them or close your account. You may request deletion of all your data at any time by contacting us.
        </Section>
        <Section title="7. Contact">
          For privacy-related questions, contact us at the address listed on the Contact page.
        </Section>
      </div>
    </LegalLayout>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-white font-semibold mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}

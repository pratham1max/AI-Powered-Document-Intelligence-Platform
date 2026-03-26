import { FileText } from "lucide-react";
import LegalLayout from "../components/LegalLayout";

export default function Terms() {
  return (
    <LegalLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/20 p-2.5 rounded-lg">
          <FileText size={20} className="text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">Last updated: March 2025</p>

      <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
        <Section title="1. Acceptance of Terms">
          By accessing or using DocIntel, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
        </Section>
        <Section title="2. Use of Service">
          DocIntel is provided for lawful document management and AI-assisted analysis. You agree not to upload illegal content, attempt to reverse-engineer the platform, or use the service to harm others.
        </Section>
        <Section title="3. Account Responsibility">
          You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Enable two-factor authentication for additional security.
        </Section>
        <Section title="4. Intellectual Property">
          You retain ownership of all documents you upload. By uploading, you grant DocIntel a limited license to process your content solely for the purpose of providing the service.
        </Section>
        <Section title="5. AI-Generated Content">
          AI responses are generated automatically and may not always be accurate. DocIntel is not liable for decisions made based on AI-generated content. Always verify important information independently.
        </Section>
        <Section title="6. Service Availability">
          We strive for high availability but do not guarantee uninterrupted service. We reserve the right to modify or discontinue features with reasonable notice.
        </Section>
        <Section title="7. Limitation of Liability">
          DocIntel is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
        </Section>
        <Section title="8. Changes to Terms">
          We may update these terms periodically. Continued use of the service after changes constitutes acceptance of the new terms.
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

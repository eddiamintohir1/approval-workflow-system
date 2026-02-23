/**
 * IP Owner: Eddie Amintohir
 * Terms of Service Page for Compawnion Jadi Berkat Workflow Management System
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mt-1">Last updated: February 23, 2026</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using the CJB Workflow Management System ("System"), you agree to be bound by these Terms of Service. This System is provided by <strong>Compawnion Jadi Berkat</strong>, operated by <strong>Eddie Amintohir</strong> ("we," "us," or "our"). If you do not agree to these terms, please do not use the System.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Eligibility and Access</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The System is intended for authorized employees and contractors of Compawnion Jadi Berkat only. To use the System, you must:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Have a valid @compawnion.co email address</li>
              <li>Be authorized by management to access the System</li>
              <li>Maintain the confidentiality of your login credentials</li>
              <li>Comply with all company policies and procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Account Security</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Logging out after each session on shared devices</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Acceptable Use</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree to use the System only for legitimate business purposes. You must not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Attempt to gain unauthorized access to system resources</li>
              <li>Interfere with or disrupt system operations</li>
              <li>Use the System for any illegal or unauthorized purpose</li>
              <li>Share confidential company information externally</li>
              <li>Upload malicious code, viruses, or harmful content</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.3 Data Accuracy</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for ensuring that all workflow submissions, forms, and data entered into the System are accurate, complete, and truthful. Inaccurate or fraudulent submissions may result in disciplinary action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The System, including all software, designs, graphics, and content, is the intellectual property of <strong>Eddie Amintohir</strong> and <strong>Compawnion Jadi Berkat</strong>. You may not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Copy, modify, or distribute system code or content</li>
              <li>Reverse engineer or decompile the System</li>
              <li>Remove or alter copyright notices</li>
              <li>Use the System's branding or trademarks without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Workflow Processing</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Submission and Approval</h3>
            <p className="text-muted-foreground leading-relaxed">
              Workflows submitted through the System are subject to company approval processes. Submission does not guarantee approval. Management reserves the right to approve, reject, or request modifications to any workflow.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Notifications</h3>
            <p className="text-muted-foreground leading-relaxed">
              You agree to receive system notifications via email and in-app alerts regarding workflow status, approvals, and system updates. These notifications are essential for system operation and cannot be disabled.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the System is also governed by our Privacy Policy. By using the System, you consent to the collection, use, and storage of your data as described in the Privacy Policy. All workflow data is considered company property.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. System Availability</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We strive to maintain system availability but do not guarantee uninterrupted access. The System may be unavailable due to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Scheduled maintenance and updates</li>
              <li>Technical issues or server downtime</li>
              <li>Force majeure events beyond our control</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We will make reasonable efforts to notify users of planned maintenance in advance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, Compawnion Jadi Berkat and Eddie Amintohir shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the System, including but not limited to loss of data, business interruption, or lost profits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Compawnion Jadi Berkat, Eddie Amintohir, and their affiliates from any claims, damages, losses, or expenses (including legal fees) arising from your violation of these Terms or misuse of the System.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We reserve the right to suspend or terminate your access to the System at any time, with or without notice, for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violation of these Terms of Service</li>
              <li>Termination of employment or contract</li>
              <li>Suspicious or fraudulent activity</li>
              <li>Any reason deemed necessary by management</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Upon termination, you must cease all use of the System and return any company materials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms of Service at any time. Users will be notified of significant changes via email or system notification. Continued use of the System after modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising from these terms shall be resolved in the courts of Indonesia.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If you have questions about these Terms of Service, please contact:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold">Compawnion Jadi Berkat</p>
              <p className="text-muted-foreground">Attn: Eddie Amintohir</p>
              <p className="text-muted-foreground">Website: <a href="https://www.compawnion.co/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.compawnion.co</a></p>
            </div>
          </section>
        </div>

        {/* IP Owner: Eddie Amintohir */}
        <footer className="border-t mt-12 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/compawnion-logo.png" alt="Compawnion" className="h-8 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span className="text-sm text-muted-foreground">
                © Compawnion Jadi Berkat. All rights reserved.
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <a href="https://www.compawnion.co/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </a>
              <span className="text-muted-foreground">v1.03</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

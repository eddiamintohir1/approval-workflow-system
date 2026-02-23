/**
 * IP Owner: Eddie Amintohir
 * Privacy Policy Page for Compawnion Jadi Berkat Workflow Management System
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-1">Last updated: February 23, 2026</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to the CJB Workflow Management System ("System"). This Privacy Policy explains how <strong>Compawnion Jadi Berkat</strong>, operated by <strong>Eddie Amintohir</strong> ("we," "us," or "our"), collects, uses, and protects your personal information when you use our workflow management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Account Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Email address (@compawnion.co domain)</li>
              <li>Full name</li>
              <li>Department and role information</li>
              <li>Authentication credentials</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Workflow Data</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you use the System, we collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Workflow submissions and approvals</li>
              <li>Form data and attachments</li>
              <li>Comments and feedback</li>
              <li>Timestamps and activity logs</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Technical Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We automatically collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Usage statistics and analytics</li>
              <li>Error logs and performance data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain the workflow management system</li>
              <li>Process workflow approvals and notifications</li>
              <li>Authenticate users and maintain account security</li>
              <li>Generate reports and analytics for management</li>
              <li>Improve system performance and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal information. We may share data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Within the Organization:</strong> With authorized employees and departments for workflow processing</li>
              <li><strong>Service Providers:</strong> With trusted third-party services for hosting, analytics, and system maintenance</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulations</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption, secure authentication (AWS Cognito), access controls, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Workflow data may be retained for audit and compliance purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal information</li>
              <li>Request corrections to inaccurate data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise these rights, please contact us at the information provided below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to maintain user sessions, remember preferences, and analyze system usage. You can control cookie settings through your browser, but disabling cookies may affect system functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify users of significant changes via email or system notification. Continued use of the System after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If you have questions about this Privacy Policy or our data practices, please contact:
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

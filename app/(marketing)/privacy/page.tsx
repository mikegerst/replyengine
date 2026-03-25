import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — ReplyEngine',
  description: 'ReplyEngine privacy policy — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="text-lg font-bold text-gray-900">ReplyEngine</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: March 25, 2026</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We collect information you provide directly: your email address and password when you create an account, your business name and configuration settings, and your Google Business Profile data when you connect your account. We also collect usage data such as page views, feature usage, and IP addresses for rate limiting and security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use your information to provide the ReplyEngine service: generating AI-powered review responses, analyzing reviews for policy violations, managing recovery outreach, and processing payments. We use your email to send account-related communications and optional weekly summary emails. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. How We Store Your Data</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your data is stored securely using Supabase (hosted on AWS infrastructure) with encryption at rest and in transit. Google OAuth tokens are stored server-side and never exposed to client-side code. Passwords are hashed by Supabase Auth and never stored in plaintext.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Third-Party Services</h2>
            <p className="text-sm text-gray-600 leading-relaxed">We use the following third-party services to operate ReplyEngine:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
              <li><strong>Supabase</strong> — Database, authentication, and real-time subscriptions</li>
              <li><strong>Stripe</strong> — Payment processing and subscription management</li>
              <li><strong>Anthropic (Claude)</strong> — AI-powered review response generation</li>
              <li><strong>Google</strong> — Google Business Profile API for review syncing</li>
              <li><strong>Resend</strong> — Transactional and notification emails</li>
              <li><strong>Vercel</strong> — Application hosting</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              Each service processes data in accordance with their own privacy policies. Review text is sent to Anthropic&apos;s API for response generation but is not used by Anthropic to train models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Your Rights</h2>
            <p className="text-sm text-gray-600 leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
              <li><strong>Access</strong> your data — view all stored information via your dashboard</li>
              <li><strong>Export</strong> your data — request a full export of your account data</li>
              <li><strong>Delete</strong> your account and all associated data</li>
              <li><strong>Disconnect</strong> your Google Business Profile at any time</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              To exercise these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Cookies</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use essential cookies for authentication session management. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Changes to This Policy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update this privacy policy from time to time. We will notify registered users of material changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Contact</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              For privacy-related questions or requests, email us at privacy@replyengine.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

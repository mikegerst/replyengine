import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — ReplyEngine',
  description: 'ReplyEngine terms of service.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="text-lg font-bold text-gray-900">ReplyEngine</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: March 25, 2026</p>

        <div className="prose prose-sm prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              By creating an account or using ReplyEngine, you agree to these Terms of Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              ReplyEngine is a SaaS platform that helps businesses manage Google review responses using AI-generated drafts. The service includes review response generation, dispute detection, recovery outreach, and review analytics.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. Account Responsibilities</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating your account. You are responsible for all activity that occurs under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Acceptable Use</h2>
            <p className="text-sm text-gray-600 leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
              <li>Use the service to generate harassing, threatening, or discriminatory content</li>
              <li>Attempt to manipulate or inject instructions into AI-generated responses</li>
              <li>Use the service to file false or fraudulent review disputes</li>
              <li>Exceed rate limits or attempt to circumvent usage restrictions</li>
              <li>Resell or redistribute the service without authorization</li>
              <li>Use the service in violation of Google&apos;s Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. AI-Generated Content</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              All AI-generated responses are drafts for your review. You are responsible for reviewing, editing, and approving all content before posting. ReplyEngine does not guarantee the accuracy, appropriateness, or legal compliance of AI-generated content. You should not post responses without reviewing them first.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Subscription and Billing</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Paid plans are billed monthly or annually via Stripe. You can cancel your subscription at any time from the billing page. Cancellation takes effect at the end of the current billing period. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Limitation of Liability</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              ReplyEngine is provided &ldquo;as is&rdquo; without warranty of any kind. We are not liable for any damages arising from the use of AI-generated content, including but not limited to reputational harm, lost business, or legal claims. Our total liability is limited to the amount you paid for the service in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Termination</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time, which will remove all associated data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. Changes to Terms</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update these terms from time to time. Material changes will be communicated via email to registered users. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. Contact</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              For questions about these terms, email us at legal@replyengine.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

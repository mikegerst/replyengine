import type { Metadata } from 'next'
import Link from 'next/link'
import { PricingToggle } from '@/components/marketing/pricing-toggle'

export const metadata: Metadata = {
  title: 'ReplyEngine — AI-Powered Google Review Response Manager',
  description:
    'Respond to every Google review with AI-powered, personalized responses. Connect your Google Business Profile, get draft responses instantly, and approve with one tap.',
  openGraph: {
    title: 'ReplyEngine — AI-Powered Google Review Response Manager',
    description:
      'Respond to every Google review with AI-powered, personalized responses. Approve with one tap.',
    type: 'website',
  },
}

const FAQ_ITEMS = [
  {
    q: 'What types of businesses can use ReplyEngine?',
    a: 'Any business with a Google Business Profile can use ReplyEngine. Our most popular industries include restaurants, dental offices, plumbing and HVAC contractors, hair salons and barbershops, law firms, auto repair shops, hotels, medical practices, real estate agencies, and retail stores. If your business receives Google reviews, ReplyEngine works for you.',
  },
  {
    q: 'How does the AI know what to say?',
    a: 'ReplyEngine uses Claude AI by Anthropic to generate responses. You configure your business type, preferred tone, and custom instructions. Claude reads each review, picks up on specific details the customer mentioned — like a dish they ordered, a service they received, or a staff member they interacted with — and crafts a response that matches your brand voice. The result sounds like you wrote it, not a bot.',
  },
  {
    q: 'Can I edit responses before posting?',
    a: 'Absolutely. Every AI-drafted response goes through you first. You can approve it as-is, edit it, regenerate a new version, or skip it entirely. Nothing gets posted without your approval.',
  },
  {
    q: 'What if I get a fake review?',
    a: 'ReplyEngine automatically scans every new review for signs of spam or policy violations. When it detects a suspicious review, it alerts you and walks you through Google\'s dispute process to get it removed.',
  },
  {
    q: 'How does ReplyEngine detect fake reviews?',
    a: 'ReplyEngine analyzes every incoming review using 12 detection signals, including reviewer history and profile age, geographic inconsistencies, language patterns common in fake reviews, timing anomalies such as review bursts, content that matches known spam templates, reviews clearly meant for a different business, and conflicts of interest. When multiple signals trigger, ReplyEngine flags the review and generates a pre-filled dispute report for submission to Google.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. Every paid plan comes with a 14-day free trial, no credit card required. The Free plan is available forever with 5 AI responses per month. Enterprise tools like Birdeye charge $299+/month and Podium charges $249+/month — ReplyEngine starts free with paid plans at $19/month and $39/month, making it 10x more affordable for small businesses.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time from the billing page. There are no long-term contracts or cancellation fees.',
  },
]

const VALUE_PROPS = [
  {
    stat: '< 30 seconds',
    description:
      'Average time to generate a personalized, on-brand response to any Google review',
  },
  {
    stat: '10x cheaper',
    description:
      'Than Birdeye ($299/mo) or Podium ($249/mo) — ReplyEngine starts free, paid plans from $19/mo',
  },
  {
    stat: '12 signals',
    description:
      'Used to detect fake and policy-violating reviews for dispute and removal from Google',
  },
]

export default function HomePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">ReplyEngine</span>
          <div className="flex items-center gap-4">
            <Link
              href="/free"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline"
            >
              Free Tool
            </Link>
            <Link
              href="/blog"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
          Never Ignore a Review Again
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          ReplyEngine uses AI to draft personalized responses to every Google review.
          Approve with one tap. Recover unhappy customers. Remove fake reviews.
          Starting free — 10x more affordable than Birdeye or Podium.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-gray-900 text-white px-8 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/free"
            className="w-full sm:w-auto bg-white text-gray-900 px-8 py-3 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Try Free Tool
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          No credit card required &middot; 14-day free trial
        </p>
      </section>

      {/* ===== BEFORE / AFTER ===== */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            See the difference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-900">Without ReplyEngine</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Generic (what most businesses do)</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 italic leading-relaxed">
                  &ldquo;Thank you for your feedback! We appreciate your support and look forward to seeing you again!&rdquo;
                </p>
              </div>
            </div>

            {/* With */}
            <div className="bg-white rounded-xl border-2 border-gray-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-900">With ReplyEngine</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Personalized (what ReplyEngine writes)</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  &ldquo;Sarah, thank you so much for the kind words about our wood-fired margherita — it&apos;s our chef Marco&apos;s pride and joy. We&apos;re glad Jake took great care of you. Next time you visit Mike&apos;s Kitchen, ask about our new seasonal truffle pizza — I think you&apos;d love it. Hope to see you again soon.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Connect',
              desc: 'Connect your Google Business Profile in 2 minutes. We handle the OAuth setup for you.',
            },
            {
              step: '2',
              title: 'Review',
              desc: 'AI drafts personalized responses to every new review, matching your brand voice and tone.',
            },
            {
              step: '3',
              title: 'Approve',
              desc: 'One tap to post. Edit if you want. Done. Spend 5 minutes instead of an hour.',
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-900 text-white text-lg font-bold flex items-center justify-center mx-auto">
                {item.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== THREE PILLARS ===== */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Shield */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Shield</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Remove fake and unfair reviews. Our AI analyzes 12 detection signals — including reviewer history, geographic inconsistencies, language patterns, timing anomalies, and known spam templates — to identify policy-violating reviews and walk you through Google&apos;s dispute process.
                Even &ldquo;positive&rdquo; reviews can hurt your score. A 4-star review on a 4.5-star business drags you down.
                ReplyEngine detects every review that&apos;s costing you — including reviews clearly meant for a different business.
              </p>
            </div>

            {/* Recover */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Recover</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Turn unhappy customers into loyal ones. AI-powered private outreach via email and SMS resolves complaints before they hurt your rating.
                Businesses using recovery outreach see up to 30% of unhappy customers improve their rating after a successful resolution.
              </p>
            </div>

            {/* Amplify */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Amplify</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Turn 5-star reviews into marketing. Every response subtly promotes your business to future customers reading your reviews.
                Over 90% of consumers read Google reviews before visiting a local business. Make every response count.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-center text-gray-500 text-sm mb-10 max-w-2xl mx-auto">
          Enterprise tools like Birdeye charge $299+/month per location and Podium charges $249+/month — ReplyEngine gives you what matters for a fraction of the cost. Start free. Upgrade when you&apos;re ready.
        </p>
        <PricingToggle />
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            Built for busy business owners
          </h2>
          <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">
            Stop losing customers to unanswered reviews. ReplyEngine handles it all so you can focus on running your business.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUE_PROPS.map((v) => (
              <div key={v.stat} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-2xl font-bold text-gray-900 mb-2">{v.stat}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="border-b border-gray-100 pb-6 last:border-0">
              <h3 className="text-sm font-semibold text-gray-900">{item.q}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Your competitors are responding to their reviews. Are you?
          </h2>
          <p className="mt-4 text-sm text-gray-300 max-w-xl mx-auto">
            Over 90% of consumers read Google reviews before visiting a local business. Businesses that respond to every review see up to 9% higher revenue.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block bg-white text-gray-900 px-8 py-3 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            No credit card required &middot; 14-day free trial &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} ReplyEngine. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/free" className="hover:text-gray-600 transition-colors">Free Tool</Link>
            <Link href="/blog" className="hover:text-gray-600 transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-gray-600 transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

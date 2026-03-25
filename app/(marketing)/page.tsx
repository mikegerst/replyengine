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
    a: 'Any business with a Google Business Profile — restaurants, dentists, plumbers, salons, law firms, auto shops, hotels, and more. If you get Google reviews, ReplyEngine works for you.',
  },
  {
    q: 'How does the AI know what to say?',
    a: 'You configure your business type, preferred tone, and custom instructions. The AI reads each review, picks up on specific details the customer mentioned, and crafts a response that matches your brand voice.',
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
    q: 'Is there a free trial?',
    a: 'Yes. Every paid plan comes with a 14-day free trial, no credit card required. The Free plan is available forever with 5 AI responses per month.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time from the billing page. There are no long-term contracts or cancellation fees.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'We went from ignoring reviews to responding to every single one within hours. Our rating went from 4.1 to 4.6 in three months.',
    name: 'Maria R.',
    business: 'Bella Cucina Italian Restaurant',
  },
  {
    quote: 'The dispute detection caught a competitor\'s fake review before it could hurt us. Worth every penny just for that.',
    name: 'Dr. James Chen',
    business: 'Bright Smile Dental',
  },
  {
    quote: 'I used to spend an hour a day on reviews. Now it takes me five minutes. The AI nails our tone every time.',
    name: 'Kevin O\'Brien',
    business: 'O\'Brien Plumbing & HVAC',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
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
                Remove fake and unfair reviews. Our AI detects policy violations and walks you through the removal process.
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
                Turn unhappy customers into loyal ones. AI-powered private outreach resolves complaints before they hurt your rating.
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
        <p className="text-center text-gray-500 text-sm mb-10">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <PricingToggle />
      </section>

      {/* ===== SOCIAL PROOF ===== */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <p className="text-center text-sm font-medium text-gray-400 mb-10">
            Trusted by 100+ local businesses
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.business}</p>
                </div>
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

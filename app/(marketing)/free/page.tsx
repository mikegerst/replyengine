import type { Metadata } from 'next'
import Link from 'next/link'
import { FreeGeneratorForm } from '@/components/marketing/free-generator-form'

export const metadata: Metadata = {
  title: 'Free Google Review Response Generator — ReplyEngine',
  description:
    'Generate professional, personalized responses to Google reviews instantly. Free tool — no signup required. Works for restaurants, dentists, salons, contractors, and more.',
  openGraph: {
    title: 'Free Google Review Response Generator',
    description:
      'Generate professional, personalized responses to Google reviews instantly. No signup required.',
    type: 'website',
  },
}

const FAQ_ITEMS = [
  {
    question: 'How should I respond to a negative Google review?',
    answer:
      'Acknowledge the customer\'s experience with empathy, apologize for any shortcomings without admitting legal fault, and offer a specific way to make it right. Always invite them to reach out directly so you can resolve the issue privately. A thoughtful response to a negative review can actually build trust with prospective customers who see it.',
  },
  {
    question: 'Does responding to Google reviews help SEO?',
    answer:
      'Yes. Google has confirmed that responding to reviews improves your local search ranking. Businesses that actively respond to reviews signal to Google that they are engaged and trustworthy, which can boost visibility in Google Maps and local search results.',
  },
  {
    question: 'Should I respond to every Google review?',
    answer:
      'Ideally, yes. Responding to every review — positive and negative — shows customers that you value their feedback. At minimum, always respond to negative reviews and any review that includes specific details or questions. Consistent responses also contribute to your local SEO.',
  },
  {
    question: 'How quickly should I respond to reviews?',
    answer:
      'Aim to respond within 24-48 hours. Faster responses show customers you are attentive and care about their experience. For negative reviews, responding quickly also helps prevent the situation from escalating on other platforms.',
  },
]

export default function FreeToolPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ReplyEngine
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/free"
              className="text-sm text-gray-900 font-medium"
            >
              Free Tool
            </Link>
            <Link
              href="/blog"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors hidden sm:inline-block"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Free Google Review Response Generator
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            Paste any review. Get a personalized, professional response in seconds.
          </p>
        </div>

        {/* Form + Result */}
        <FreeGeneratorForm />

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gray-50 rounded-xl p-8 sm:p-12 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Want this for EVERY review — automatically?
          </h2>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto">
            ReplyEngine connects to your Google Business Profile and drafts
            personalized responses to every review. Approve with one tap.
          </p>
          <div className="mt-6">
            <Link
              href="/signup"
              className="inline-block bg-gray-900 text-white px-8 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            No credit card required &middot; 14-day free trial &middot; Cancel anytime
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question}>
                <h3 className="text-sm font-semibold text-
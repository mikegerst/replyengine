import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ReplyEngine — AI-Powered Google Review Management for Small Business',
    template: '%s | ReplyEngine',
  },
  description:
    'ReplyEngine uses AI to draft personalized responses to every Google review in under 30 seconds. Detect fake reviews, recover unhappy customers, and grow your rating. Free plan available. An affordable alternative to Birdeye and Podium.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyengine.com'),
  openGraph: {
    title: 'ReplyEngine — AI-Powered Google Review Management for Small Business',
    description:
      'Draft personalized review responses in 30 seconds. Detect fake reviews. Recover unhappy customers. Starting free — 10x more affordable than Birdeye or Podium.',
    type: 'website',
    siteName: 'ReplyEngine',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReplyEngine — AI Google Review Management',
    description:
      'AI-powered review responses, fake review detection, and customer recovery. Starting free.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: 'https://replyengine.com' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ReplyEngine',
    url: 'https://replyengine.com',
    description: 'AI-powered Google review response management for small businesses.',
    foundingDate: '2026',
  }

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ReplyEngine',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Review Management Software',
    operatingSystem: 'Web',
    url: 'https://replyengine.com',
    description:
      'AI-powered Google review response management for small businesses. Generates personalized review responses, detects fake reviews, and runs customer recovery outreach.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '39',
      priceCurrency: 'USD',
      offerCount: '3',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: '5 AI responses/month, 1 location, fake review detection',
        },
        {
          '@type': 'Offer',
          name: 'Starter',
          price: '19',
          priceCurrency: 'USD',
          description: 'Unlimited AI responses, 3 locations, recovery outreach, analytics',
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '39',
          priceCurrency: 'USD',
          description: 'Unlimited everything, unlimited locations, priority support',
        },
      ],
    },
    featureList: [
      'AI-powered personalized review response generation',
      'Fake and spam review detection with 12-signal analysis',
      'Private customer recovery outreach via email and SMS',
      'Review analytics dashboard with sentiment tracking',
      'Multi-location business management',
      'Google Business Profile integration via OAuth',
      'One-tap response approval workflow',
    ],
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

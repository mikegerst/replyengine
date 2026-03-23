import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReplyEngine — AI Review Response Manager',
  description: 'Respond to every Google review with AI-powered, personalized responses.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

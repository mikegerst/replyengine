import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">ReplyEngine</span>
          <div className="flex items-center gap-4">
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

      <main className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
          Respond to every review
          <br />
          <span className="text-gray-400">with AI precision</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
          ReplyEngine connects to your Google Business Profile, drafts personalized
          responses to every review, and lets you approve with one tap.
        </p>
        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </main>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog/mdx'
import { BlogCard } from '@/components/blog/blog-card'

export const metadata: Metadata = {
  title: 'Blog — Review Management Guides, Comparisons & Strategy',
  description:
    'Guides, comparisons, and strategies for managing Google reviews, responding to customers, and growing your online reputation.',
  openGraph: {
    title: 'ReplyEngine Blog',
    description:
      'Guides, comparisons, and strategies for managing Google reviews.',
    type: 'website',
  },
}

const CATEGORIES = ['All', 'Comparisons', 'Guides', 'Strategy'] as const

export default function BlogIndexPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const posts = getAllPosts()
  const activeCategory = searchParams.category ?? 'All'
  const filtered =
    activeCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ReplyEngine
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/free"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline"
            >
              Free Tool
            </Link>
            <Link
              href="/blog"
              className="text-sm text-gray-900 font-medium hidden sm:inline"
            >
              Blog
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

      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Blog
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            Guides, comparisons, and strategies for managing your Google reviews and growing your online reputation.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === 'All' ? '/blog' : `/blog?category=${cat}`}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Posts Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-12">No posts yet in this category.</p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ReplyEngine. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

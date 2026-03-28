'use client'

import Link from 'next/link'
import type { BlogPostMeta } from '@/lib/blog/types'

interface TocItem {
  id: string
  text: string
  level: number
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const items: TocItem[] = []
  let match = headingRegex.exec(content)
  while (match) {
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    items.push({ id, text, level: match[1].length })
    match = headingRegex.exec(content)
  }
  return items
}

interface BlogPostLayoutProps {
  title: string
  date: string
  lastUpdated: string
  readingTime: number
  category: string
  author: string
  content: string
  renderedContent: React.ReactNode
  relatedPosts: BlogPostMeta[]
}

export function BlogPostLayout({
  title,
  date,
  lastUpdated,
  readingTime,
  category,
  author,
  content,
  renderedContent,
  relatedPosts,
}: BlogPostLayoutProps) {
  const toc = extractToc(content)

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
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline"
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

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Article Header */}
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Link
                href="/blog"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                &larr; Blog
              </Link>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {category}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
              {title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span>By {author}</span>
              <span>&middot;</span>
              <span>
                {new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {lastUpdated !== date && (
                <>
                  <span>&middot;</span>
                  <span>
                    Updated{' '}
                    {new Date(lastUpdated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </>
              )}
              <span>&middot;</span>
              <span>{readingTime} min read</span>
            </div>
          </div>

          {/* Table of Contents */}
          {toc.length > 0 && (
            <nav className="mb-10 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Table of Contents
              </p>
              <ul className="space-y-1">
                {toc.map((item) => (
                  <li
                    key={item.id}
                    className={item.level === 3 ? 'pl-4' : ''}
                  >
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Article Body */}
          <div className="prose prose-gray max-w-none prose-headings:scroll-mt-20 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-p:text-sm prose-p:leading-relaxed prose-p:text-gray-600 prose-li:text-sm prose-li:text-gray-600 prose-strong:text-gray-900 prose-a:text-gray-900 prose-a:underline">
            {renderedContent}
          </div>
        </article>

        {/* Author Bio */}
        <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{author}</p>
          <p className="mt-1 text-sm text-gray-500">
            Founder of ReplyEngine. Helping small businesses manage their online reputation with AI.
          </p>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Related articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-400">{post.category}</span>
                  <p className="mt-1 text-sm font-semibold text-gray-900 leading-snug">
                    {post.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-12 text-center bg-gray-900 rounded-xl p-8 sm:p-12">
          <h2 className="text-xl font-bold text-white">
            Try ReplyEngine free — AI-powered review responses in 30 seconds
          </h2>
          <p className="mt-3 text-sm text-gray-300 max-w-md mx-auto">
            Connect your Google Business Profile and start responding to reviews today. No credit card required.
          </p>
          <div className="mt-6">
            <Link
              href="/signup"
              className="inline-block bg-white text-gray-900 px-8 py-3 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
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

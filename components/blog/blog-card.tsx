import Link from 'next/link'
import type { BlogPostMeta } from '@/lib/blog/types'

interface BlogCardProps {
  post: BlogPostMeta
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-400 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {post.category}
        </span>
        <span className="text-xs text-gray-400">{post.readingTime} min read</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 leading-snug">{post.title}</h3>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">
        {post.description}
      </p>
      <p className="mt-3 text-xs text-gray-400">
        {new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </Link>
  )
}

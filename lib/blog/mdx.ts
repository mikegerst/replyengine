import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { BlogPost, BlogPostMeta } from './types'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

function getMdxFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return []
  }
  return fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith('.mdx'))
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const stats = readingTime(content)

  return {
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    lastUpdated: data.lastUpdated as string,
    author: data.author as string,
    category: data.category as BlogPostMeta['category'],
    tags: data.tags as string[],
    readingTime: Math.ceil(stats.minutes),
    slug,
    content,
  }
}

export function getAllPosts(): BlogPostMeta[] {
  const files = getMdxFiles()

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, '')
    const post = getPostBySlug(slug)
    if (!post) return null

    const { content: _, ...meta } = post
    return meta
  }).filter((p): p is BlogPostMeta => p !== null)

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPostMeta[] {
  const current = getPostBySlug(currentSlug)
  if (!current) return []

  const allPosts = getAllPosts().filter((p) => p.slug !== currentSlug)

  const scored = allPosts.map((post) => {
    let score = 0
    if (post.category === current.category) score += 2
    const overlap = post.tags.filter((t) => current.tags.includes(t)).length
    score += overlap
    return { post, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.post)
}

export function getAllSlugs(): string[] {
  return getMdxFiles().map((file) => file.replace(/\.mdx$/, ''))
}

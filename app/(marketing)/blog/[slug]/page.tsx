import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog/mdx'
import { BlogPostLayout } from '@/components/blog/blog-post-layout'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const post = getPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.lastUpdated,
      authors: [post.author],
    },
    alternates: {
      canonical: `https://replyengine.com/blog/${post.slug}`,
    },
  }
}

function hasFaqSection(content: string): boolean {
  return /^##\s+(FAQ|Frequently Asked Questions)/m.test(content)
}

function extractFaqItems(content: string): Array<{ question: string; answer: string }> {
  const faqMatch = content.match(/^##\s+(?:FAQ|Frequently Asked Questions)[\s\S]*$/m)
  if (!faqMatch) return []

  const faqContent = faqMatch[0]
  const items: Array<{ question: string; answer: string }> = []
  const questionRegex = /\*\*(.+?)\*\*\s*\n\n([^*]+?)(?=\n\n\*\*|\n\n##|$)/g
  let match = questionRegex.exec(faqContent)
  while (match) {
    items.push({ question: match[1].trim(), answer: match[2].trim() })
    match = questionRegex.exec(faqContent)
  }
  return items
}

export default function BlogPostPage({ params }: PageProps) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const relatedPosts = getRelatedPosts(params.slug, 3)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'ReplyEngine' },
    datePublished: post.date,
    dateModified: post.lastUpdated,
  }

  const faqItems = hasFaqSection(post.content) ? extractFaqItems(post.content) : []
  const faqSchema =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null

  const mdxComponents = {
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = typeof children === 'string' ? children : ''
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      )
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = typeof children === 'string' ? children : ''
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      )
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <BlogPostLayout
        title={post.title}
        date={post.date}
        lastUpdated={post.lastUpdated}
        readingTime={post.readingTime}
        category={post.category}
        author={post.author}
        content={post.content}
        renderedContent={
          <MDXRemote source={post.content} components={mdxComponents} />
        }
        relatedPosts={relatedPosts}
      />
    </>
  )
}

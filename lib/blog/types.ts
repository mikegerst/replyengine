export interface BlogPostMeta {
  title: string
  description: string
  date: string
  lastUpdated: string
  author: string
  category: 'Comparisons' | 'Guides' | 'Strategy' | 'Product'
  tags: string[]
  readingTime: number
  slug: string
}

export interface BlogPost extends BlogPostMeta {
  content: string
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/utils/rate-limit', () => ({
  rateLimitResponse: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/utils/resolve-business', () => ({
  resolveBusinessId: vi.fn().mockResolvedValue('biz-001'),
}))

import { GET } from '@/app/api/disputes/route'

const mockUser = { id: 'user-001', email: 'test@example.com' }

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/disputes')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url)
}

describe('GET /api/disputes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('returns disputes for authenticated user with starter plan', async () => {
    const disputeData = [
      {
        id: 'dispute-1',
        status: 'flagged',
        reviews: { id: 'rev-1', star_rating: 1 },
      },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { plan: 'starter' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'review_disputes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                data: disputeData,
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await GET(createRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual(disputeData)
  })

  it('returns 403 for free plan user', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { plan: 'free' },
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await GET(createRequest())

    expect(response.status).toBe(403)
  })

  it('returns 401 for unauthenticated user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const response = await GET(createRequest())

    expect(response.status).toBe(401)
  })

  it('allows pro plan user to access disputes', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { plan: 'pro' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'review_disputes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await GET(createRequest())

    expect(response.status).toBe(200)
  })

  it('dispute status transitions are represented in data', async () => {
    const disputes = [
      { id: 'd1', status: 'flagged' },
      { id: 'd2', status: 'appeal_ready' },
      { id: 'd3', status: 'appealed' },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { plan: 'pro' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'review_disputes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                data: disputes,
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await GET(createRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    const statuses = body.data.map((d: { status: string }) => d.status)
    expect(statuses).toContain('flagged')
    expect(statuses).toContain('appeal_ready')
  })
})

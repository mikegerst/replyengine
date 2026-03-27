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

vi.mock('@/lib/utils/api-budget', () => ({
  apiBudgetResponse: vi.fn().mockResolvedValue(null),
  incrementApiUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/ai/generate-recovery', () => ({
  generateRecoverySequence: vi.fn().mockResolvedValue({
    phase1: { message: 'Phase 1 message', sendAfterDays: 0 },
    phase2: { message: 'Phase 2 message', sendAfterDays: 7 },
    phase3: { message: 'Phase 3 message', sendAfterDays: null },
    phase4: { message: 'Phase 4 message', sendAfterDays: null },
    suggestedResolution: 'Offer complimentary visit',
  }),
}))

import { GET, POST } from '@/app/api/recovery/route'

const mockUser = { id: 'user-001', email: 'test@example.com' }

function createGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/recovery')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url)
}

function createPostRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('creates 4-phase outreach sequence', async () => {
    const insertedData = [
      { id: 'out-1', phase: 1 },
      { id: 'out-2', phase: 2 },
      { id: 'out-3', phase: 3 },
      { id: 'out-4', phase: 4 },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: {
                  id: 'rev-001',
                  business_id: 'biz-001',
                  star_rating: 1,
                  review_text: 'Terrible.',
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: {
                  id: 'biz-001',
                  plan: 'pro',
                  name: 'Test Business',
                  tone: 'professional',
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'recovery_outreach') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              data: insertedData,
              error: null,
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await POST(
      createPostRequest({ review_id: '550e8400-e29b-41d4-a716-446655440000' })
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data).toHaveLength(4)
  })

  it('requires Pro plan (returns 403 for free)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { id: 'rev-001', business_id: 'biz-001' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { id: 'biz-001', plan: 'free' },
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await POST(
      createPostRequest({ review_id: '550e8400-e29b-41d4-a716-446655440000' })
    )

    expect(response.status).toBe(403)
  })

  it('rejects duplicate outreach for same review (409)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { id: 'rev-001', business_id: 'biz-001' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { id: 'biz-001', plan: 'pro', name: 'Test' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'recovery_outreach') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: [{ id: 'existing-outreach' }],
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await POST(
      createPostRequest({ review_id: '550e8400-e29b-41d4-a716-446655440000' })
    )

    expect(response.status).toBe(409)
  })

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const response = await POST(
      createPostRequest({ review_id: '550e8400-e29b-41d4-a716-446655440000' })
    )

    expect(response.status).toBe(401)
  })
})

describe('GET /api/recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('returns outreach data for pro plan business', async () => {
    const outreachData = [
      { id: 'out-1', phase: 1, reviews: { id: 'rev-1' } },
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
      if (table === 'recovery_outreach') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                data: outreachData,
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    const response = await GET(createGetRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual(outreachData)
  })
})

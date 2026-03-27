import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

const mockUser = { id: 'user-001', email: 'test@example.com' }
const mockGetUser = vi.fn()

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

import { GET } from '@/app/api/reviews/route'

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/reviews')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url)
}

describe('GET /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Build chainable query mock
    const queryResult = {
      data: [
        { id: 'rev-1', star_rating: 5, response_status: 'pending' },
        { id: 'rev-2', star_rating: 3, response_status: 'draft' },
      ],
      error: null,
      count: 2,
    }

    // Every chainable method must return an object with all chain methods + thenable
    const chainable = () => ({
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      order: mockOrder,
      range: mockRange,
      then: (resolve: (v: unknown) => void) => resolve(queryResult),
    })
    mockRange.mockImplementation(chainable)
    mockOrder.mockImplementation(chainable)
    mockIn.mockImplementation(chainable)
    mockEq.mockImplementation(chainable)
    mockSelect.mockImplementation(chainable)
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('returns paginated reviews for authenticated user', async () => {
    const request = createRequest()
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(2)
    expect(body.total).toBe(2)
  })

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = createRequest()
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('applies status filter when provided', async () => {
    const request = createRequest({ status: 'pending' })
    await GET(request)

    expect(mockEq).toHaveBeenCalledWith('response_status', 'pending')
  })

  it('applies star_rating filter when provided', async () => {
    const request = createRequest({ star_rating: '5' })
    await GET(request)

    expect(mockEq).toHaveBeenCalledWith('star_rating', 5)
  })

  it('returns 400 for invalid query params', async () => {
    const request = createRequest({ star_rating: '10' })
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles business_id=all for multi-location', async () => {
    const { resolveBusinessId } = await import('@/lib/utils/resolve-business')

    // For all locations, the route fetches businesses directly
    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              data: [{ id: 'biz-001' }, { id: 'biz-002' }],
              error: null,
            }),
          }),
        }
      }
      return { select: mockSelect }
    })

    const request = createRequest({ business_id: 'all' })
    await GET(request)

    // Should use .in() for multi-location query
    expect(resolveBusinessId).not.toHaveBeenCalled()
  })
})

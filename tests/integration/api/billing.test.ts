import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSessionCreate = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: mockSessionCreate,
      },
    },
  })),
}))

vi.mock('@/lib/stripe/plans', () => ({
  getPriceId: vi.fn((plan: string) => {
    if (plan === 'starter') return 'price_starter_123'
    if (plan === 'pro') return 'price_pro_456'
    return ''
  }),
}))

vi.mock('@/lib/utils/rate-limit', () => ({
  rateLimitResponse: vi.fn().mockResolvedValue(null),
}))

import { POST } from '@/app/api/billing/checkout/route'

function createRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/billing/checkout', () => {
  const mockUser = { id: 'user-001', email: 'test@example.com' }
  const mockBusiness = {
    id: 'biz-001',
    owner_id: 'user-001',
    stripe_customer_id: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockBusiness,
              error: null,
            }),
          }),
        }),
      }),
    })

    mockSessionCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/session_123',
    })
  })

  it('creates a Stripe session for starter plan', async () => {
    const response = await POST(createRequest({ plan: 'starter' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.url).toContain('stripe.com')
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_starter_123', quantity: 1 }],
      })
    )
  })

  it('creates a Stripe session for pro plan', async () => {
    const response = await POST(createRequest({ plan: 'pro' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.url).toBeDefined()
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_pro_456', quantity: 1 }],
      })
    )
  })

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const response = await POST(createRequest({ plan: 'starter' }))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 for invalid plan name', async () => {
    const response = await POST(createRequest({ plan: 'enterprise' }))

    expect(response.status).toBe(400)
  })

  it('includes business_id and user_id in session metadata', async () => {
    await POST(createRequest({ plan: 'starter' }))

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          business_id: 'biz-001',
          user_id: 'user-001',
        },
      })
    )
  })

  it('uses existing stripe_customer_id when available', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: { ...mockBusiness, stripe_customer_id: 'cus_existing' },
              error: null,
            }),
          }),
        }),
      }),
    })

    await POST(createRequest({ plan: 'pro' }))

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing',
      })
    )
  })
})

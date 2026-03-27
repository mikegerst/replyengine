import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockConstructEvent = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockSubscriptionsRetrieve,
    },
  })),
}))

vi.mock('@/lib/stripe/plans', () => ({
  planFromPriceId: vi.fn((priceId: string) => {
    if (priceId === 'price_starter') return 'starter'
    if (priceId === 'price_pro') return 'pro'
    return 'free'
  }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

import { POST } from '@/app/api/webhooks/stripe/route'

function createWebhookRequest(body: string, signature = 'sig_test'): Request {
  return new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body,
  })
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSingle.mockReturnValue({ data: null, error: null })
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
  })

  it('returns 400 without valid Stripe signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = createWebhookRequest('{}')
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 without stripe-signature header', async () => {
    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Missing signature')
  })

  it('checkout.session.completed updates business plan', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      id: 'evt_1',
      data: {
        object: {
          metadata: { business_id: 'biz-001', user_id: 'user-001' },
          customer: 'cus_123',
          subscription: 'sub_123',
        },
      },
    })

    // Idempotency check: no existing subscription
    mockSingle.mockReturnValue({
      data: { stripe_subscription_id: null },
      error: null,
    })

    mockSubscriptionsRetrieve.mockResolvedValue({
      items: { data: [{ price: { id: 'price_starter' } }] },
    })

    const request = createWebhookRequest('{}')
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('customer.subscription.updated changes plan level', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      id: 'evt_2',
      data: {
        object: {
          customer: 'cus_123',
          items: { data: [{ price: { id: 'price_pro' } }] },
        },
      },
    })

    mockSingle.mockReturnValue({
      data: { plan: 'starter' },
      error: null,
    })

    const request = createWebhookRequest('{}')
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('customer.subscription.deleted downgrades to free', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      id: 'evt_3',
      data: {
        object: {
          customer: 'cus_123',
        },
      },
    })

    mockSingle.mockReturnValue({
      data: { plan: 'pro' },
      error: null,
    })

    const request = createWebhookRequest('{}')
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('invoice.payment_failed is handled without error', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      id: 'evt_4',
      data: {
        object: {
          customer: 'cus_123',
        },
      },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const request = createWebhookRequest('{}')
    const response = await POST(request)
    consoleSpy.mockRestore()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.received).toBe(true)
  })

  it('idempotency: duplicate checkout event does not double update', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      id: 'evt_dup',
      data: {
        object: {
          metadata: { business_id: 'biz-001' },
          customer: 'cus_123',
          subscription: 'sub_123',
        },
      },
    })

    // Already has this subscription
    mockSingle.mockReturnValue({
      data: { stripe_subscription_id: 'sub_123' },
      error: null,
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const request = createWebhookRequest('{}')
    const response = await POST(request)
    consoleSpy.mockRestore()

    expect(response.status).toBe(200)
    // subscriptions.retrieve should NOT be called for duplicate
    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}))

// Set env vars before import
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

import { checkRateLimit, rateLimitResponse } from '@/lib/utils/rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  it('allows first request within window', async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: true, current_count: 1 }],
      error: null,
    })

    const result = await checkRateLimit('user:123', 100, 60000)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(99)
    expect(result.retryAfterSeconds).toBeNull()
  })

  it('blocks request exceeding max count', async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: false, current_count: 101 }],
      error: null,
    })

    const result = await checkRateLimit('user:123', 100, 60000)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBe(60) // 60000ms / 1000
  })

  it('allows request when RPC fails (fail-open)', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Function not found' },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await checkRateLimit('user:123', 100, 60000)
    consoleSpy.mockRestore()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(100)
  })

  it('passes correct parameters to RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: true, current_count: 5 }],
      error: null,
    })

    await checkRateLimit('api:reviews', 50, 30000)

    expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
      p_key: 'api:reviews',
      p_max_count: 50,
      p_window_ms: 30000,
    })
  })
})

describe('rateLimitResponse', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  it('returns null for allowed requests', async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: true, current_count: 1 }],
      error: null,
    })

    const response = await rateLimitResponse('user:123', 100, 60000)

    expect(response).toBeNull()
  })

  it('returns a 429 Response for blocked requests', async () => {
    mockRpc.mockResolvedValue({
      data: [{ allowed: false, current_count: 101 }],
      error: null,
    })

    const response = await rateLimitResponse('user:123', 100, 60000)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(429)

    const body = await response!.json()
    expect(body.error).toContain('Too many requests')

    expect(response!.headers.get('Retry-After')).toBe('60')
  })
})

import { vi } from 'vitest'

interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  rpc: ReturnType<typeof vi.fn>
  setReturnData: (data: unknown) => void
  setReturnError: (error: { message: string; code?: string }) => void
  _returnData: unknown
  _returnError: { message: string; code?: string } | null
  _returnCount: number | null
}

export function createMockSupabaseClient(): MockSupabaseClient {
  let returnData: unknown = null
  let returnError: { message: string; code?: string } | null = null
  let returnCount: number | null = null

  const buildResult = () => ({
    data: returnData,
    error: returnError,
    count: returnCount,
  })

  const chainable: Record<string, ReturnType<typeof vi.fn>> = {}

  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'order',
    'range',
    'limit',
    'filter',
    'match',
    'not',
    'is',
    'gte',
    'lte',
    'gt',
    'lt',
    'like',
    'ilike',
    'contains',
    'containedBy',
    'overlaps',
    'textSearch',
  ] as const

  const terminalProxy = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (value: unknown) => void) => resolve(buildResult())
        }
        if (prop === 'single') {
          return vi.fn().mockImplementation(() => buildResult())
        }
        if (methods.includes(prop as (typeof methods)[number])) {
          return vi.fn().mockReturnValue(terminalProxy)
        }
        return undefined
      },
    }
  )

  for (const method of methods) {
    chainable[method] = vi.fn().mockReturnValue(terminalProxy)
  }

  chainable['single'] = vi.fn().mockImplementation(() => buildResult())

  const fromFn = vi.fn().mockReturnValue(
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === 'then') {
            return (resolve: (value: unknown) => void) =>
              resolve(buildResult())
          }
          if (typeof prop === 'string' && chainable[prop]) {
            return chainable[prop]
          }
          if (
            typeof prop === 'string' &&
            methods.includes(prop as (typeof methods)[number])
          ) {
            return vi.fn().mockReturnValue(terminalProxy)
          }
          return undefined
        },
      }
    )
  )

  const rpcFn = vi.fn().mockImplementation(() => buildResult())

  const mock: MockSupabaseClient = {
    from: fromFn,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-001', email: 'test@example.com' } },
        error: null,
      }),
    },
    rpc: rpcFn,
    setReturnData(data: unknown) {
      returnData = data
    },
    setReturnError(error: { message: string; code?: string }) {
      returnError = error
      returnData = null
    },
    get _returnData() {
      return returnData
    },
    get _returnError() {
      return returnError
    },
    get _returnCount() {
      return returnCount
    },
  }

  return mock
}

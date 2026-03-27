import { vi } from 'vitest'

interface MockCall {
  model: string
  max_tokens: number
  system: string
  messages: Array<{ role: string; content: string }>
}

interface MockAnthropicClient {
  messages: {
    create: ReturnType<typeof vi.fn>
  }
  setResponseText: (text: string) => void
  getCalls: () => MockCall[]
  getLastCall: () => MockCall | undefined
  reset: () => void
}

export function createMockAnthropicClient(): MockAnthropicClient {
  let responseText = ''
  const calls: MockCall[] = []

  const createFn = vi.fn().mockImplementation(async (params: MockCall) => {
    calls.push(params)
    return {
      content: [{ type: 'text', text: responseText }],
      model: params.model,
      role: 'assistant',
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 },
    }
  })

  return {
    messages: {
      create: createFn,
    },
    setResponseText(text: string) {
      responseText = text
    },
    getCalls() {
      return [...calls]
    },
    getLastCall() {
      return calls[calls.length - 1]
    },
    reset() {
      calls.length = 0
      createFn.mockClear()
    },
  }
}

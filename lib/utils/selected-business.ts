const STORAGE_KEY = 'replyengine_selected_business_id'

export function getSelectedBusinessId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setSelectedBusinessId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, id)
}

export function buildApiUrl(path: string, params?: Record<string, string>): string {
  const businessId = getSelectedBusinessId()
  const searchParams = new URLSearchParams(params)
  if (businessId) {
    searchParams.set('business_id', businessId)
  }
  const qs = searchParams.toString()
  return qs ? `${path}?${qs}` : path
}

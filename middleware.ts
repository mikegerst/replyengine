import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Apply security headers to non-API routes (HTML pages)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  if (!isApiRoute) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

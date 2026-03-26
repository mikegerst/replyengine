import { createClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/utils/encryption'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface GoogleTokens {
  accessToken: string
  refreshToken: string
}

/**
 * Reads and decrypts Google OAuth tokens for a business.
 * Returns null if the business has no tokens stored.
 */
export async function getGoogleTokens(businessId: string): Promise<GoogleTokens | null> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('businesses')
    .select('google_access_token, google_refresh_token')
    .eq('id', businessId)
    .single()

  if (error || !data) {
    return null
  }

  const encryptedAccess = data.google_access_token as string | null
  const encryptedRefresh = data.google_refresh_token as string | null

  if (!encryptedAccess && !encryptedRefresh) {
    return null
  }

  return {
    accessToken: encryptedAccess ? decrypt(encryptedAccess) : '',
    refreshToken: encryptedRefresh ? decrypt(encryptedRefresh) : '',
  }
}

/**
 * Encrypts and saves Google OAuth tokens for a business.
 */
export async function saveGoogleTokens(
  businessId: string,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('businesses')
    .update({
      google_access_token: encrypt(accessToken),
      google_refresh_token: encrypt(refreshToken),
      google_token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    })
    .eq('id', businessId)

  if (error) {
    throw new Error(`Failed to save Google tokens: ${error.message}`)
  }
}

/**
 * Clears Google OAuth tokens for a business (disconnect).
 */
export async function clearGoogleTokens(businessId: string): Promise<void> {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('businesses')
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
    })
    .eq('id', businessId)

  if (error) {
    throw new Error(`Failed to clear Google tokens: ${error.message}`)
  }
}

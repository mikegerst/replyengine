import { createClient } from '@supabase/supabase-js'
import { encrypt, isEncrypted } from '@/lib/utils/encryption'

interface MigrationResult {
  migrated: number
  skipped: number
  errors: number
}

/**
 * One-time migration: encrypts plaintext Google OAuth tokens in the businesses table.
 * Safe to run multiple times — already-encrypted tokens are skipped.
 */
export async function migrateTokensToEncrypted(): Promise<MigrationResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, google_access_token, google_refresh_token')
    .or('google_access_token.not.is.null,google_refresh_token.not.is.null')

  if (error) {
    throw new Error(`Failed to query businesses: ${error.message}`)
  }

  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const biz of businesses ?? []) {
    const accessToken = biz.google_access_token as string | null
    const refreshToken = biz.google_refresh_token as string | null

    const accessAlreadyEncrypted = accessToken ? isEncrypted(accessToken) : true
    const refreshAlreadyEncrypted = refreshToken ? isEncrypted(refreshToken) : true

    if (accessAlreadyEncrypted && refreshAlreadyEncrypted) {
      skipped++
      continue
    }

    try {
      const updateData: Record<string, string> = {}

      if (accessToken && !accessAlreadyEncrypted) {
        updateData.google_access_token = encrypt(accessToken)
      }
      if (refreshToken && !refreshAlreadyEncrypted) {
        updateData.google_refresh_token = encrypt(refreshToken)
      }

      const { error: updateError } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', biz.id)

      if (updateError) {
        console.error(`Failed to migrate tokens for business ${biz.id}:`, updateError.message)
        errors++
      } else {
        migrated++
      }
    } catch (encryptError) {
      console.error(`Encryption error for business ${biz.id}:`, encryptError instanceof Error ? encryptError.message : 'Unknown error')
      errors++
    }
  }

  return { migrated, skipped, errors }
}

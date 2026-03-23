import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve which business to use. If business_id is provided and the user owns it,
 * use that. Otherwise fall back to the user's first business.
 */
export async function resolveBusinessId(
  supabase: SupabaseClient,
  userId: string,
  requestedBusinessId?: string | null
): Promise<string | null> {
  if (requestedBusinessId) {
    const { data } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', requestedBusinessId)
      .eq('owner_id', userId)
      .limit(1)

    if (data && data.length > 0) {
      return data[0].id
    }
  }

  // Fall back to first business
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  return businesses?.[0]?.id ?? null
}

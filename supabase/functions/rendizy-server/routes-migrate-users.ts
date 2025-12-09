import { getSupabaseClient } from './kv_store.tsx'

function looksLikeUuid(v?: string) {
  if (!v) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const dry = url.searchParams.get('dry') !== 'false'

  const supabase = getSupabaseClient()

  // list Edge KV keys (available in the Edge runtime)
  let list
  try {
    // @ts-ignore - `kv` is provided by Supabase Edge runtime
    list = await kv.list()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to list KV keys: ' + String(e) }), { status: 500 })
  }

  const keys = Array.isArray(list) ? list.map((k: any) => (k.name || k)) : (list.keys || [])
  const userKeys = keys.filter((k: any) => typeof k === 'string' ? k.startsWith('user:') : (k.name && k.name.startsWith && k.name.startsWith('user:')))

  const report: any = { totalKeys: userKeys.length, processed: 0, errors: [], ops: [] }

  for (const k of userKeys) {
    const keyName = typeof k === 'string' ? k : k.name
    try {
      // @ts-ignore
      const raw = await kv.get(keyName)
      let userData: any = null
      if (!raw) {
        report.errors.push({ key: keyName, error: 'empty' })
        continue
      }
      if (typeof raw === 'string') {
        userData = JSON.parse(raw)
      } else if (raw.value) {
        try { userData = JSON.parse(raw.value) } catch (_) { userData = raw.value }
      } else {
        userData = raw
      }

      const payload: any = {
        email: userData.email || null,
        username: userData.username || userData.email || null,
        name: userData.name || null,
        type: userData.type || 'user',
        status: userData.status || 'active',
        organization_id: userData.organization_id || null,
        invited_at: userData.invited_at || null,
        joined_at: userData.joined_at || null,
        created_at: userData.created_at || null,
        created_by: userData.created_by || null,
        updated_at: userData.updated_at || null,
      }

      if (userData.id && looksLikeUuid(userData.id)) payload.id = userData.id

      if (dry) {
        report.ops.push({ key: keyName, action: 'dry-upsert', payload })
      } else {
        const { data, error } = await supabase.from('users').upsert([payload], { onConflict: 'email' }).select('id,email')
        if (error) {
          report.errors.push({ key: keyName, error: String(error) })
        } else {
          report.processed += 1
          const userId = data && data[0] && data[0].id ? data[0].id : null
          report.ops.push({ key: keyName, action: 'upsert', userId })
          try {
            if (userId) {
              await supabase.from('users_kv_mappings').upsert([{ kv_id: keyName, user_id: userId }], { onConflict: 'kv_id' })
            }
          } catch (e) {
            report.ops.push({ key: keyName, mappingError: String(e) })
          }
        }
      }
    } catch (e) {
      report.errors.push({ key: keyName, error: String(e) })
    }
  }

  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

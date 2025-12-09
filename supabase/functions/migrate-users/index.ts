import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Supabase Edge Function to migrate users stored in KV to the `users` SQL table.
// Usage:
//  - Deploy the function to Supabase.
//  - Call: GET /?dry=true  -> dry-run (default)
//  - Call: GET /?dry=false -> apply migration

function getEnv(key: string) {
  try {
    // Deno and Node compatibility
    // @ts-ignore
    if (typeof Deno !== 'undefined' && Deno?.env?.get) return Deno.env.get(key)
  } catch (e) {}
  // @ts-ignore
  return process?.env?.[key]
}

function looksLikeUuid(v?: string) {
  if (!v) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const dry = url.searchParams.get('dry') !== 'false'

  const supabaseUrl = getEnv('SUPABASE_URL')
  const serviceRole = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_ROLE')
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })

  // list KV keys and filter for superadmin entries only
  let list
  try {
    // `kv` expected to be available in Supabase Edge runtime
    // @ts-ignore
    list = await kv.list()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to list KV keys: ' + String(e) }), { status: 500 })
  }

  const keys = Array.isArray(list) ? list.map((k: any) => (k.name || k)) : (list.keys || [])
  const userKeys = keys.filter((k: any) => typeof k === 'string' ? k.startsWith('superadmin:') : (k.name && k.name.startsWith && k.name.startsWith('superadmin:')))

  const startAt = Date.now()
  const report: any = { totalKeys: userKeys.length, processed: 0, errors: [], ops: [], backups: 0, mappingsInserted: 0 }
  console.info(`migrate-users:start totalKeys=${userKeys.length} dry=${dry}`)

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

      // Backup KV row into kv_backups table (idempotent: on conflict do nothing)
      try {
        // ensure value is an object for jsonb column
        const backupRow = { kv_key: keyName, value: userData, backed_up_at: new Date().toISOString() }
        const { error: be } = await supabase.from('kv_backups').upsert([backupRow], { onConflict: 'kv_key' })
        if (be) {
          // non-fatal: record the error
          report.errors.push({ key: keyName, backupError: String(be) })
        } else {
          report.backups += 1
        }
      } catch (e) {
        report.errors.push({ key: keyName, backupError: String(e) })
      }

      // Map fields to SQL columns (ensure password_hash exists to satisfy NOT NULL)
      const payload: any = {
        email: userData.email || null,
        username: userData.username || userData.email || null,
        name: userData.name || null,
        password_hash: userData.password_hash || ('migrated+' + keyName),
        type: userData.type || 'superadmin',
        status: userData.status || 'active',
        organization_id: userData.organization_id || null,
        invited_at: userData.invited_at || null,
        joined_at: userData.joined_at || null,
        created_at: userData.created_at || null,
        created_by: userData.created_by || null,
        updated_at: userData.updated_at || null,
      }

      // Only set id if it looks like a UUID (avoid DB errors if table expects UUID)
      if (userData.id && looksLikeUuid(userData.id)) payload.id = userData.id

      if (dry) {
        report.ops.push({ key: keyName, action: 'dry-upsert', payload })
      } else {
        // Upsert into users by username to be deterministic
        try {
          const { data, error } = await supabase.from('users').upsert([payload], { onConflict: 'username' }).select('id,username')
          if (error) {
            report.errors.push({ key: keyName, error: String(error) })
            continue
          }
          report.processed += 1
          const userId = data && data[0] && data[0].id ? data[0].id : null
          report.ops.push({ key: keyName, action: 'upsert', userId })

          // try to persist mapping (if table exists)
          try {
            if (userId) {
              const { data: md, error: me } = await supabase.from('users_kv_mappings')
                .upsert([{ kv_key: keyName, user_id: userId, migrated_at: new Date().toISOString() }], { onConflict: 'kv_key' })
              if (me) {
                report.ops.push({ key: keyName, mappingError: String(me) })
              } else {
                report.mappingsInserted += 1
              }
            }
          } catch (e) {
            // mapping insert failed — non-fatal, include in report
            report.ops.push({ key: keyName, mappingError: String(e) })
          }
        } catch (e) {
          report.errors.push({ key: keyName, error: String(e) })
        }
      }
    } catch (e) {
      report.errors.push({ key: k, error: String(e) })
    }
  }

  const durationMs = Date.now() - startAt
  const summary = {
    totalKeys: report.totalKeys,
    processed: report.processed,
    backups: report.backups,
    mappingsInserted: report.mappingsInserted,
    errors: report.errors.length,
    ops: report.ops.length,
    durationMs,
  }

  // Limit ops payload to avoid huge responses
  const MAX_OPS = 500
  const responseBody: any = {
    summary,
    ops: report.ops.slice(0, MAX_OPS),
    errors: report.errors,
  }
  if (report.ops.length > MAX_OPS) responseBody.truncated_ops = report.ops.length - MAX_OPS

  console.info('migrate-users:done', summary)

  return new Response(JSON.stringify(responseBody, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

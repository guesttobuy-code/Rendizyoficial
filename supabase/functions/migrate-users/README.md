# migrate-users

Supabase Edge Function to migrate user records stored in KV to the `users` SQL table.

Usage
1. Deploy this function to your Supabase project (same project linked to this repo).
2. Make sure environment variables are set on the function (or available in runtime):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key is required for upserts and mapping table writes)
3. Run a dry-run first to review what would be applied:

   ```pwsh
   npx supabase functions invoke migrate-users --project-ref <your-project-ref> --data "?dry=true"
   ```

   Or call the deployed endpoint:

   ```http
   GET https://<your-functions-host>/migrate-users?dry=true
   ```

4. After reviewing the dry-run report, run the apply (dry=false):

   ```pwsh
   npx supabase functions invoke migrate-users --project-ref <your-project-ref> --data "?dry=false"
   ```

Notes and caveats
- The script looks for KV keys starting with `user:`.
- It will upsert into the `users` table using `email` as conflict key.
- If your `users.id` column is UUID and KV ids are short custom ids, the script will not force non-UUID ids into the `id` column — DB will generate one and the script will write a mapping to `users_kv_mappings` when possible.
- The function attempts to upsert into `users_kv_mappings` (table must exist). Create it beforehand with:

```sql
CREATE TABLE IF NOT EXISTS users_kv_mappings (
  kv_id text PRIMARY KEY,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

- Review the dry-run output carefully before running apply. Keep backups and run in a maintenance window if production.

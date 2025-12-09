import { getSupabaseClient } from '../kv_store.tsx';

export type SqlUser = any;

export function mapSqlToUser(sqlUser: SqlUser) {
  return {
    id: sqlUser.id,
    organizationId: sqlUser.organization_id,
    name: sqlUser.name,
    email: sqlUser.email,
    role: sqlUser.type === 'imobiliaria' ? 'admin' : 'staff',
    status: sqlUser.status,
    createdAt: sqlUser.created_at,
    createdBy: sqlUser.created_by || null,
    invitedAt: sqlUser.invited_at || null,
    joinedAt: sqlUser.joined_at || null
  };
}

export default class UsersRepository {
  static client() {
    return getSupabaseClient();
  }

  static async findById(id: string) {
    const supabase = this.client();
    return supabase.from('users').select('*').eq('id', id).maybeSingle();
  }

  static async findByEmail(email: string) {
    const supabase = this.client();
    return supabase.from('users').select('*').ilike('email', email).maybeSingle();
  }

  static async create(user: any) {
    const supabase = this.client();
    // Try insert; if conflict, try update (upsert semantics)
    const { data, error } = await supabase.from('users').insert(user).select().single();
    if (!error) return { data, error: null };

    // If insert failed due to conflict, try upsert by email
    try {
      const { data: upserted, error: upsertErr } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'email' })
        .select()
        .single();
      return { data: upserted, error: upsertErr };
    } catch (e) {
      return { data: null, error: error };
    }
  }

  static async update(id: string, updates: any) {
    const supabase = this.client();
    return supabase.from('users').update(updates).eq('id', id).select().single();
  }

  static async delete(id: string) {
    const supabase = this.client();
    return supabase.from('users').delete().eq('id', id);
  }

  static async activate(id: string) {
    const supabase = this.client();
    const updates = {
      status: 'active',
      joined_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return supabase.from('users').update(updates).eq('id', id).select().single();
  }

  static async resendInvite(id: string) {
    const supabase = this.client();
    const updates = { invited_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    return supabase.from('users').update(updates).eq('id', id).select().single();
  }
}

/**
 * UTILS - Safe Database Operations
 * 
 * Helpers para operações seguras de banco de dados
 * Protege contra erros de triggers que esperam campos como updated_at
 * 
 * @version 1.0.103.400
 * @updated 2025-11-17 - Versão simplificada e mais eficiente
 */

/**
 * Remove campos que não existem na tabela antes de fazer upsert
 * Protege contra erros de triggers que esperam updated_at
 * 
 * @param data - Dados para sanitizar
 * @param removeFields - Campos a remover (default: ['updated_at'])
 * @returns Dados sanitizados sem os campos especificados
 */
export function sanitizeDbData(data: any, removeFields: string[] = ["updated_at"]): any {
  const result = { ...data };
  for (const f of removeFields) delete result[f];
  return result;
}

/**
 * Upsert seguro que não assume que updated_at existe
 * 
 * @param client - Supabase client
 * @param table - Nome da tabela
 * @param data - Dados para upsert
 * @param options - Opções do upsert (onConflict, ignoreDuplicates, etc)
 * @param selectFields - Campos para selecionar (string com campos separados por vírgula)
 * @returns Promise<{ data: any, error: any }>
 */
export async function safeUpsert(
  client: any,
  table: string,
  data: any,
  options: any,
  selectFields: string
): Promise<{ data: any; error: any }> {
  // ✅ Sanitizar dados removendo updated_at automaticamente
  let payload = sanitizeDbData(data, ["updated_at"]);

  // ✅ Fazer upsert com select explícito (sem updated_at)
  // Primeiro tentar com .single(), se falhar tentar buscar manualmente
  let { data: result, error } = await client
    .from(table)
    .upsert(payload, options)
    .select(selectFields)
    .single();
  
  // Se .single() falhar (pode acontecer em alguns casos), tentar buscar manualmente
  if (error) {
    console.warn('⚠️ [safeUpsert] .single() falhou, tentando buscar registro:', error?.message);
    
    // Tentar buscar o registro que acabou de ser criado/atualizado
    const conflictField = options?.onConflict || 'id';
    const conflictValue = payload[conflictField];
    
    if (conflictValue) {
      const fetchResult = await client
        .from(table)
        .select(selectFields)
        .eq(conflictField, conflictValue)
        .maybeSingle();
      
      if (!fetchResult.error && fetchResult.data) {
        result = fetchResult.data;
        error = null;
        console.log('✅ [safeUpsert] Registro encontrado após upsert via busca manual');
      } else {
        console.error('❌ [safeUpsert] Erro ao buscar registro após upsert:', fetchResult.error);
      }
    }
  }

  return { data: result, error };
}


// ============================================================================
// ROTAS DO MÓDULO FINANCEIRO
// ============================================================================

import type { Context } from 'npm:hono';
import { getSupabaseClient } from './kv_store.tsx';
import { getTenant, isSuperAdmin } from './utils-tenancy.ts';
import { getOrganizationIdOrThrow } from './utils-get-organization-id.ts';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  logInfo,
  logError,
  getCurrentDateTime,
} from './utils.ts';
import {
  lancamentoToSql,
  sqlToLancamento,
  tituloToSql,
  sqlToTitulo,
  contaBancariaToSql,
  sqlToContaBancaria,
  categoriaToSql,
  sqlToCategoria,
  centroCustoToSql,
  sqlToCentroCusto,
  splitToSql,
  sqlToSplit,
  LANCAMENTO_SELECT_FIELDS,
  TITULO_SELECT_FIELDS,
  CONTA_BANCARIA_SELECT_FIELDS,
  CATEGORIA_SELECT_FIELDS,
  CENTRO_CUSTO_SELECT_FIELDS,
} from './utils-financeiro-mapper.ts';
import type { 
  Lancamento, 
  Titulo, 
  ContaBancaria, 
  CentroCusto, 
  ContaContabil, 
  SplitDestino 
} from './utils-financeiro-mapper.ts';

// ============================================================================
// LANÇAMENTOS
// ============================================================================

/**
 * Listar lançamentos
 */
export async function listLancamentos(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    
    logInfo(`Listing lancamentos for tenant: ${tenant.username} (${tenant.type})`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Query params
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '25'), 100);
    const dataInicio = c.req.query('dataInicio');
    const dataFim = c.req.query('dataFim');
    const tipo = c.req.query('tipo');
    const categoriaId = c.req.query('categoriaId');
    const centroCustoId = c.req.query('centroCustoId');
    const contaId = c.req.query('contaId');
    const conciliado = c.req.query('conciliado');
    const busca = c.req.query('busca');
    const orderBy = c.req.query('orderBy') || 'data';
    const order = c.req.query('order') === 'asc' ? 'asc' : 'desc';

    // Construir query
    let query = client
      .from('financeiro_lancamentos')
      .select(LANCAMENTO_SELECT_FIELDS);

    // Filtrar por organização (multi-tenant)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Aplicar filtros
    if (dataInicio) {
      query = query.gte('data', dataInicio);
    }
    if (dataFim) {
      query = query.lte('data', dataFim);
    }
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }
    if (centroCustoId) {
      query = query.eq('centro_custo_id', centroCustoId);
    }
    if (contaId) {
      query = query.eq('conta_id', contaId);
    }
    if (conciliado !== undefined) {
      query = query.eq('conciliado', conciliado === 'true');
    }
    if (busca) {
      query = query.ilike('descricao', `%${busca}%`);
    }

    // Ordenar
    query = query.order(orderBy, { ascending: order === 'asc' });

    // Contar total (antes de paginar)
    const { count } = await client
      .from('financeiro_lancamentos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId || '00000000-0000-0000-0000-000000000001');

    // Paginar
    const skip = (page - 1) * limit;
    query = query.range(skip, skip + limit - 1);

    const { data: rows, error } = await query;

    if (error) {
      console.error('❌ [listLancamentos] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar lançamentos', { details: error.message }), 500);
    }

    // Converter para formato TypeScript
    const lancamentos = (rows || []).map(sqlToLancamento);

    // Buscar splits se houver lançamentos com split
    const lancamentosComSplit = lancamentos.filter(l => l.hasSplit);
    if (lancamentosComSplit.length > 0) {
      const lancamentoIds = lancamentosComSplit.map(l => l.id);
      const { data: splitsRows } = await client
        .from('financeiro_lancamentos_splits')
        .select('*')
        .in('lancamento_id', lancamentoIds);

      // Agrupar splits por lançamento
      const splitsMap = new Map<string, SplitDestino[]>();
      (splitsRows || []).forEach(splitRow => {
        const split = sqlToSplit(splitRow);
        if (!splitsMap.has(split.lancamentoId!)) {
          splitsMap.set(split.lancamentoId!, []);
        }
        splitsMap.get(split.lancamentoId!)!.push(split);
      });

      // Adicionar splits aos lançamentos
      lancamentos.forEach(l => {
        if (l.hasSplit && splitsMap.has(l.id)) {
          l.splits = splitsMap.get(l.id)!;
        }
      });
    }

    return c.json({
      success: true,
      data: lancamentos,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    logError('Erro ao listar lançamentos:', error);
    return c.json(errorResponse('Erro ao listar lançamentos', { details: error.message }), 500);
  }
}

/**
 * Criar lançamento
 */
export async function createLancamento(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const body = await c.req.json();

    logInfo(`Creating lancamento for tenant: ${tenant.username}`, body);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    } else {
      // SuperAdmin: usar organization_id do body ou fallback
      organizationId = body.organizationId || '00000000-0000-0000-0000-000000000001';
    }

    // Validações
    if (!body.tipo || !['entrada', 'saida', 'transferencia'].includes(body.tipo)) {
      return c.json(validationErrorResponse('Tipo de lançamento inválido'), 400);
    }
    if (!body.data) {
      return c.json(validationErrorResponse('Data é obrigatória'), 400);
    }
    if (!body.valor || body.valor <= 0) {
      return c.json(validationErrorResponse('Valor deve ser maior que zero'), 400);
    }
    if (!body.descricao) {
      return c.json(validationErrorResponse('Descrição é obrigatória'), 400);
    }
    if (body.tipo !== 'transferencia' && !body.categoriaId) {
      return c.json(validationErrorResponse('Categoria é obrigatória para este tipo de lançamento'), 400);
    }
    if (!body.contaId) {
      return c.json(validationErrorResponse('Conta bancária é obrigatória'), 400);
    }

    // Validar transferência
    if (body.tipo === 'transferencia') {
      if (!body.contaOrigemId || !body.contaDestinoId) {
        return c.json(validationErrorResponse('Transferência requer conta origem e destino'), 400);
      }
      if (body.contaOrigemId === body.contaDestinoId) {
        return c.json(validationErrorResponse('Conta origem e destino devem ser diferentes'), 400);
      }
    }

    // Validar splits
    if (body.hasSplit && body.splits && body.splits.length > 0) {
      const totalPercentual = body.splits
        .filter((s: SplitDestino) => s.tipo === 'percentual')
        .reduce((sum: number, s: SplitDestino) => sum + (s.percentual || 0), 0);
      
      const totalValor = body.splits
        .filter((s: SplitDestino) => s.tipo === 'valor')
        .reduce((sum: number, s: SplitDestino) => sum + (s.valor || 0), 0);

      if (totalPercentual > 0 && Math.abs(totalPercentual - 100) > 0.01) {
        return c.json(validationErrorResponse('Soma dos percentuais deve ser 100%'), 400);
      }
      if (totalValor > 0 && Math.abs(totalValor - body.valor) > 0.01) {
        return c.json(validationErrorResponse('Soma dos valores deve ser igual ao valor total'), 400);
      }
    }

    // Gerar ID (UUID)
    const id = crypto.randomUUID();

    // Criar objeto Lancamento
    const lancamento: Lancamento = {
      id,
      tipo: body.tipo,
      data: body.data,
      competencia: body.competencia || body.data,
      descricao: body.descricao,
      valor: body.valor,
      moeda: body.moeda || 'BRL',
      categoriaId: body.categoriaId,
      categoriaNome: body.categoriaNome,
      contaId: body.contaId,
      contaNome: body.contaNome,
      contaOrigemId: body.contaOrigemId,
      contaDestinoId: body.contaDestinoId,
      centroCustoId: body.centroCustoId,
      documento: body.documento,
      notaFiscal: body.notaFiscal,
      observacoes: body.observacoes,
      conciliado: false,
      hasSplit: body.hasSplit || false,
      splits: body.splits || [],
      createdBy: tenant.userId || 'system',
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
    };

    // Converter para SQL
    const sqlData = lancamentoToSql(lancamento, organizationId);

    // Inserir lançamento
    const { data: insertedRow, error: insertError } = await client
      .from('financeiro_lancamentos')
      .insert(sqlData)
      .select(LANCAMENTO_SELECT_FIELDS)
      .single();

    if (insertError) {
      console.error('❌ [createLancamento] SQL error inserting:', insertError);
      return c.json(errorResponse('Erro ao criar lançamento', { details: insertError.message }), 500);
    }

    // Inserir splits se houver
    if (lancamento.hasSplit && lancamento.splits && lancamento.splits.length > 0) {
      const splitsData = lancamento.splits.map(split => 
        splitToSql(split, id, organizationId)
      );

      const { error: splitsError } = await client
        .from('financeiro_lancamentos_splits')
        .insert(splitsData);

      if (splitsError) {
        console.error('❌ [createLancamento] Erro ao inserir splits:', splitsError);
        // Não falhar, apenas logar
      }
    }

    // Atualizar saldo da conta
    if (lancamento.contaId) {
      await atualizarSaldoConta(lancamento.contaId, lancamento.tipo, lancamento.valor);
    }

    // Converter resultado para TypeScript
    const createdLancamento = sqlToLancamento(insertedRow);

    logInfo(`✅ Lançamento criado: ${id}`);

    return c.json({
      success: true,
      data: createdLancamento,
    }, 201);
  } catch (error: any) {
    logError('Erro ao criar lançamento:', error);
    return c.json(errorResponse('Erro ao criar lançamento', { details: error.message }), 500);
  }
}

/**
 * Atualizar lançamento
 */
export async function updateLancamento(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const { id } = c.req.param();
    const body = await c.req.json();

    logInfo(`Updating lancamento ${id} for tenant: ${tenant.username}`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Buscar lançamento existente
    let query = client
      .from('financeiro_lancamentos')
      .select(LANCAMENTO_SELECT_FIELDS)
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: existingRow, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error('❌ [updateLancamento] SQL error fetching:', fetchError);
      return c.json(errorResponse('Erro ao buscar lançamento', { details: fetchError.message }), 500);
    }

    if (!existingRow) {
      return c.json(notFoundResponse('Lançamento não encontrado'), 404);
    }

    // Verificar se está conciliado (não pode editar)
    if (existingRow.conciliado && !body.force) {
      return c.json(validationErrorResponse('Lançamento conciliado não pode ser editado'), 400);
    }

    // Mesclar dados
    const lancamentoAtualizado: Lancamento = {
      ...sqlToLancamento(existingRow),
      ...body,
      id, // Preservar ID
      updatedAt: getCurrentDateTime(),
    };

    // Converter para SQL
    const sqlData = lancamentoToSql(lancamentoAtualizado, organizationId || existingRow.organization_id);

    // Atualizar
    const { data: updatedRow, error: updateError } = await client
      .from('financeiro_lancamentos')
      .update(sqlData)
      .eq('id', id)
      .select(LANCAMENTO_SELECT_FIELDS)
      .single();

    if (updateError) {
      console.error('❌ [updateLancamento] SQL error updating:', updateError);
      return c.json(errorResponse('Erro ao atualizar lançamento', { details: updateError.message }), 500);
    }

    // Atualizar splits se necessário
    if (body.splits !== undefined) {
      // Deletar splits antigos
      await client
        .from('financeiro_lancamentos_splits')
        .delete()
        .eq('lancamento_id', id);

      // Inserir novos splits
      if (body.splits && body.splits.length > 0) {
        const splitsData = body.splits.map((split: SplitDestino) => 
          splitToSql(split, id, organizationId || existingRow.organization_id)
        );

        await client
          .from('financeiro_lancamentos_splits')
          .insert(splitsData);
      }
    }

    logInfo(`✅ Lançamento atualizado: ${id}`);

    return c.json({
      success: true,
      data: sqlToLancamento(updatedRow),
    });
  } catch (error: any) {
    logError('Erro ao atualizar lançamento:', error);
    return c.json(errorResponse('Erro ao atualizar lançamento', { details: error.message }), 500);
  }
}

/**
 * Excluir lançamento
 */
export async function deleteLancamento(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const { id } = c.req.param();

    logInfo(`Deleting lancamento ${id} for tenant: ${tenant.username}`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Buscar lançamento
    let query = client
      .from('financeiro_lancamentos')
      .select('id, conciliado, organization_id')
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: existing, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error('❌ [deleteLancamento] SQL error fetching:', fetchError);
      return c.json(errorResponse('Erro ao buscar lançamento', { details: fetchError.message }), 500);
    }

    if (!existing) {
      return c.json(notFoundResponse('Lançamento não encontrado'), 404);
    }

    // Verificar se está conciliado
    if (existing.conciliado) {
      return c.json(validationErrorResponse('Lançamento conciliado não pode ser excluído'), 400);
    }

    // Deletar splits primeiro (foreign key)
    await client
      .from('financeiro_lancamentos_splits')
      .delete()
      .eq('lancamento_id', id);

    // Deletar lançamento
    const { error: deleteError } = await client
      .from('financeiro_lancamentos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ [deleteLancamento] SQL error deleting:', deleteError);
      return c.json(errorResponse('Erro ao excluir lançamento', { details: deleteError.message }), 500);
    }

    logInfo(`✅ Lançamento excluído: ${id}`);

    return c.json({
      success: true,
      message: 'Lançamento excluído com sucesso',
    });
  } catch (error: any) {
    logError('Erro ao excluir lançamento:', error);
    return c.json(errorResponse('Erro ao excluir lançamento', { details: error.message }), 500);
  }
}

// ============================================================================
// TÍTULOS
// ============================================================================

/**
 * Listar títulos
 */
export async function listTitulos(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();

    logInfo(`Listing titulos for tenant: ${tenant.username}`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Query params
    const tipo = c.req.query('tipo'); // 'receber' ou 'pagar'
    const status = c.req.query('status');
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '25'), 100);

    // Construir query
    let query = client
      .from('financeiro_titulos')
      .select(TITULO_SELECT_FIELDS);

    // Filtrar por organização
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Aplicar filtros
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Ordenar por vencimento
    query = query.order('vencimento', { ascending: true });

    // Contar total
    const { count } = await client
      .from('financeiro_titulos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId || '00000000-0000-0000-0000-000000000001');

    // Paginar
    const skip = (page - 1) * limit;
    query = query.range(skip, skip + limit - 1);

    const { data: rows, error } = await query;

    if (error) {
      console.error('❌ [listTitulos] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar títulos', { details: error.message }), 500);
    }

    // Converter para formato TypeScript
    const titulos = (rows || []).map(sqlToTitulo);

    return c.json({
      success: true,
      data: titulos,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    logError('Erro ao listar títulos:', error);
    return c.json(errorResponse('Erro ao listar títulos', { details: error.message }), 500);
  }
}

/**
 * Criar título
 */
export async function createTitulo(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const body = await c.req.json();

    logInfo(`Creating titulo for tenant: ${tenant.username}`, body);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    } else {
      organizationId = body.organizationId || '00000000-0000-0000-0000-000000000001';
    }

    // Validações
    if (!body.tipo || !['receber', 'pagar'].includes(body.tipo)) {
      return c.json(validationErrorResponse('Tipo de título inválido'), 400);
    }
    if (!body.descricao) {
      return c.json(validationErrorResponse('Descrição é obrigatória'), 400);
    }
    if (!body.valorOriginal || body.valorOriginal <= 0) {
      return c.json(validationErrorResponse('Valor original deve ser maior que zero'), 400);
    }
    if (!body.emissao || !body.vencimento) {
      return c.json(validationErrorResponse('Emissão e vencimento são obrigatórios'), 400);
    }

    // Gerar ID (UUID)
    const id = crypto.randomUUID();

    // Criar objeto Titulo
    const titulo: Titulo = {
      id,
      tipo: body.tipo,
      emissao: body.emissao,
      vencimento: body.vencimento,
      pessoa: body.pessoa || 'N/A',
      pessoaId: body.pessoaId,
      descricao: body.descricao,
      moeda: body.moeda || 'BRL',
      valorOriginal: body.valorOriginal,
      valor: body.valorOriginal,
      valorPago: 0,
      saldo: body.valorOriginal,
      desconto: body.desconto || 0,
      juros: 0,
      multa: 0,
      categoriaId: body.categoriaId,
      centroCustoId: body.centroCustoId,
      contaBancariaId: body.contaBancariaId,
      status: 'aberto',
      recorrente: body.recorrente || false,
      parcela: body.parcela,
      totalParcelas: body.totalParcelas,
      observacoes: body.observacoes,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
    };

    // Converter para SQL
    const sqlData = tituloToSql(titulo, organizationId);

    // Inserir título
    const { data: insertedRow, error: insertError } = await client
      .from('financeiro_titulos')
      .insert(sqlData)
      .select(TITULO_SELECT_FIELDS)
      .single();

    if (insertError) {
      console.error('❌ [createTitulo] SQL error inserting:', insertError);
      return c.json(errorResponse('Erro ao criar título', { details: insertError.message }), 500);
    }

    logInfo(`✅ Título criado: ${id}`);

    return c.json({
      success: true,
      data: sqlToTitulo(insertedRow),
    }, 201);
  } catch (error: any) {
    logError('Erro ao criar título:', error);
    return c.json(errorResponse('Erro ao criar título', { details: error.message }), 500);
  }
}

/**
 * Quitar título
 */
export async function quitarTitulo(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const { id } = c.req.param();
    const body = await c.req.json();

    logInfo(`Quitando título ${id} for tenant: ${tenant.username}`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Buscar título
    let query = client
      .from('financeiro_titulos')
      .select(TITULO_SELECT_FIELDS)
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: existingRow, error: fetchError } = await query.maybeSingle();

    if (fetchError || !existingRow) {
      return c.json(notFoundResponse('Título não encontrado'), 404);
    }

    const titulo = sqlToTitulo(existingRow);

    // Validar status
    if (titulo.status === 'pago') {
      return c.json(validationErrorResponse('Título já está pago'), 400);
    }
    if (titulo.status === 'cancelado') {
      return c.json(validationErrorResponse('Título cancelado não pode ser quitado'), 400);
    }

    // Calcular valores
    const valorPago = body.valorPago || titulo.valorOriginal;
    const valorRestante = titulo.valorOriginal - valorPago;
    const novoStatus = valorRestante <= 0 ? 'pago' : 'parcial';

    // Calcular juros e multa se vencido
    let juros = 0;
    let multa = 0;
    if (new Date(titulo.vencimento) < new Date()) {
      const diasAtraso = Math.ceil((Date.now() - new Date(titulo.vencimento).getTime()) / (1000 * 60 * 60 * 24));
      multa = titulo.valorOriginal * 0.02; // 2%
      juros = titulo.valorOriginal * 0.01 * (diasAtraso / 30); // 1% ao mês pro-rata
    }

    // Atualizar título
    const { data: updatedRow, error: updateError } = await client
      .from('financeiro_titulos')
      .update({
        valor_pago: valorPago,
        valor_restante: valorRestante,
        status: novoStatus,
        pagamento: body.dataPagamento || new Date().toISOString().substring(0, 10),
        juros_calculado: juros,
        multa_calculada: multa,
        updated_at: getCurrentDateTime(),
      })
      .eq('id', id)
      .select(TITULO_SELECT_FIELDS)
      .single();

    if (updateError) {
      console.error('❌ [quitarTitulo] SQL error updating:', updateError);
      return c.json(errorResponse('Erro ao quitar título', { details: updateError.message }), 500);
    }

    logInfo(`✅ Título quitado: ${id}`);

    return c.json({
      success: true,
      data: sqlToTitulo(updatedRow),
    });
  } catch (error: any) {
    logError('Erro ao quitar título:', error);
    return c.json(errorResponse('Erro ao quitar título', { details: error.message }), 500);
  }
}

// ============================================================================
// CONTAS BANCÁRIAS
// ============================================================================

/**
 * Listar contas bancárias
 */
export async function listContasBancarias(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();

    logInfo(`Listing contas bancarias for tenant: ${tenant.username}`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Construir query
    let query = client
      .from('financeiro_contas_bancarias')
      .select(CONTA_BANCARIA_SELECT_FIELDS)
      .eq('ativo', true);

    // Filtrar por organização
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Ordenar por nome
    query = query.order('nome', { ascending: true });

    const { data: rows, error } = await query;

    if (error) {
      console.error('❌ [listContasBancarias] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar contas bancárias', { details: error.message }), 500);
    }

    // Converter para formato TypeScript
    const contas = (rows || []).map(sqlToContaBancaria);

    return c.json({
      success: true,
      data: contas,
    });
  } catch (error: any) {
    logError('Erro ao listar contas bancárias:', error);
    return c.json(errorResponse('Erro ao listar contas bancárias', { details: error.message }), 500);
  }
}

/**
 * Criar conta bancária
 */
export async function createContaBancaria(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const body = await c.req.json();

    logInfo(`Creating conta bancaria for tenant: ${tenant.username}`, body);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    } else {
      organizationId = body.organizationId || '00000000-0000-0000-0000-000000000001';
    }

    // Validações
    if (!body.nome) {
      return c.json(validationErrorResponse('Nome é obrigatório'), 400);
    }
    if (!body.tipo || !['corrente', 'poupanca', 'investimento'].includes(body.tipo)) {
      return c.json(validationErrorResponse('Tipo de conta inválido'), 400);
    }

    // Gerar ID (UUID)
    const id = crypto.randomUUID();

    // Criar objeto ContaBancaria
    const conta: ContaBancaria = {
      id,
      nome: body.nome,
      banco: body.banco,
      agencia: body.agencia,
      numero: body.numero,
      tipo: body.tipo,
      moeda: body.moeda || 'BRL',
      saldo: body.saldo || 0,
      saldoInicial: body.saldoInicial || body.saldo || 0,
      ativo: true,
      statusFeed: body.statusFeed,
      ultimaSincronizacao: body.ultimaSincronizacao,
      consentimentoId: body.consentimentoId,
      consentimentoValidade: body.consentimentoValidade,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
    };

    // Converter para SQL
    const sqlData = contaBancariaToSql(conta, organizationId);

    // Inserir conta
    const { data: insertedRow, error: insertError } = await client
      .from('financeiro_contas_bancarias')
      .insert(sqlData)
      .select(CONTA_BANCARIA_SELECT_FIELDS)
      .single();

    if (insertError) {
      console.error('❌ [createContaBancaria] SQL error inserting:', insertError);
      return c.json(errorResponse('Erro ao criar conta bancária', { details: insertError.message }), 500);
    }

    logInfo(`✅ Conta bancária criada: ${id}`);

    return c.json({
      success: true,
      data: sqlToContaBancaria(insertedRow),
    }, 201);
  } catch (error: any) {
    logError('Erro ao criar conta bancária:', error);
    return c.json(errorResponse('Erro ao criar conta bancária', { details: error.message }), 500);
  }
}

// ============================================================================
// CATEGORIAS (Plano de Contas)
// ============================================================================

/**
 * Listar categorias
 */
export async function listCategorias(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();

    logInfo(`Listing categorias for tenant: ${tenant.username}`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Construir query
    let query = client
      .from('financeiro_categorias')
      .select(CATEGORIA_SELECT_FIELDS)
      .eq('ativo', true);

    // Filtrar por organização
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Ordenar por código
    query = query.order('codigo', { ascending: true });

    const { data: rows, error } = await query;

    if (error) {
      console.error('❌ [listCategorias] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar categorias', { details: error.message }), 500);
    }

    // Converter para formato TypeScript
    const categorias = (rows || []).map(sqlToCategoria);

    return c.json({
      success: true,
      data: categorias,
    });
  } catch (error: any) {
    logError('Erro ao listar categorias:', error);
    return c.json(errorResponse('Erro ao listar categorias', { details: error.message }), 500);
  }
}

/**
 * Criar categoria
 */
export async function createCategoria(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const body = await c.req.json();

    logInfo(`Creating categoria for tenant: ${tenant.username}`, body);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    } else {
      organizationId = body.organizationId || '00000000-0000-0000-0000-000000000001';
    }

    // Validações
    if (!body.codigo) {
      return c.json(validationErrorResponse('Código é obrigatório'), 400);
    }
    if (!body.nome) {
      return c.json(validationErrorResponse('Nome é obrigatório'), 400);
    }
    if (!body.tipo || !['receita', 'despesa', 'transferencia'].includes(body.tipo)) {
      return c.json(validationErrorResponse('Tipo de categoria inválido'), 400);
    }
    if (!body.natureza || !['devedora', 'credora'].includes(body.natureza)) {
      return c.json(validationErrorResponse('Natureza é obrigatória'), 400);
    }

    // Verificar se código já existe
    const { data: existing } = await client
      .from('financeiro_categorias')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('codigo', body.codigo)
      .maybeSingle();

    if (existing) {
      return c.json(validationErrorResponse('Código já existe para esta organização'), 400);
    }

    // Calcular nível
    const nivel = body.codigo.split('.').length;

    // Gerar ID (UUID)
    const id = crypto.randomUUID();

    // Criar objeto ContaContabil
    const categoria: ContaContabil = {
      id,
      codigo: body.codigo,
      nome: body.nome,
      tipo: body.tipo,
      natureza: body.natureza,
      nivel,
      parentId: body.parentId,
      analitica: nivel >= 4,
      moeda: 'BRL',
      ativo: true,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
    };

    // Converter para SQL
    const sqlData = categoriaToSql(categoria, organizationId);

    // Inserir categoria
    const { data: insertedRow, error: insertError } = await client
      .from('financeiro_categorias')
      .insert(sqlData)
      .select(CATEGORIA_SELECT_FIELDS)
      .single();

    if (insertError) {
      console.error('❌ [createCategoria] SQL error inserting:', insertError);
      return c.json(errorResponse('Erro ao criar categoria', { details: insertError.message }), 500);
    }

    logInfo(`✅ Categoria criada: ${id}`);

    return c.json({
      success: true,
      data: sqlToCategoria(insertedRow),
    }, 201);
  } catch (error: any) {
    logError('Erro ao criar categoria:', error);
    return c.json(errorResponse('Erro ao criar categoria', { details: error.message }), 500);
  }
}

// ============================================================================
// CENTRO DE CUSTOS
// ============================================================================

/**
 * Listar centros de custo
 */
export async function listCentroCustos(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();

    logInfo(`Listing centro custos for tenant: ${tenant.username}`);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    }

    // Construir query
    let query = client
      .from('financeiro_centro_custos')
      .select(CENTRO_CUSTO_SELECT_FIELDS)
      .eq('ativo', true);

    // Filtrar por organização
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Ordenar por nome
    query = query.order('nome', { ascending: true });

    const { data: rows, error } = await query;

    if (error) {
      console.error('❌ [listCentroCustos] SQL error:', error);
      return c.json(errorResponse('Erro ao buscar centros de custo', { details: error.message }), 500);
    }

    // Converter para formato TypeScript
    const centros = (rows || []).map(sqlToCentroCusto);

    return c.json({
      success: true,
      data: centros,
    });
  } catch (error: any) {
    logError('Erro ao listar centros de custo:', error);
    return c.json(errorResponse('Erro ao listar centros de custo', { details: error.message }), 500);
  }
}

/**
 * Criar centro de custo
 */
export async function createCentroCusto(c: Context) {
  try {
    const tenant = getTenant(c);
    const client = getSupabaseClient();
    const body = await c.req.json();

    logInfo(`Creating centro custo for tenant: ${tenant.username}`, body);

    // Obter organization_id
    let organizationId: string | undefined;
    if (tenant.type !== 'superadmin') {
      organizationId = await getOrganizationIdOrThrow(c);
    } else {
      organizationId = body.organizationId || '00000000-0000-0000-0000-000000000001';
    }

    // Validações
    if (!body.nome) {
      return c.json(validationErrorResponse('Nome é obrigatório'), 400);
    }
    if (!body.tipo || !['propriedade', 'projeto', 'departamento', 'outro'].includes(body.tipo)) {
      return c.json(validationErrorResponse('Tipo de centro de custo inválido'), 400);
    }

    // Gerar ID (UUID)
    const id = crypto.randomUUID();

    // Criar objeto CentroCusto
    const centroCusto: CentroCusto = {
      id,
      codigo: body.codigo,
      nome: body.nome,
      descricao: body.descricao,
      tipo: body.tipo === 'propriedade' ? 'unidade' : body.tipo === 'projeto' ? 'projeto' : body.tipo === 'departamento' ? 'departamento' : 'tarefa',
      ativo: true,
      orcamentoMensal: body.orcamentoMensal,
      orcamentoAnual: body.orcamentoAnual,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
    };

    // Converter para SQL
    const sqlData = centroCustoToSql(centroCusto, organizationId);

    // Inserir centro de custo
    const { data: insertedRow, error: insertError } = await client
      .from('financeiro_centro_custos')
      .insert(sqlData)
      .select(CENTRO_CUSTO_SELECT_FIELDS)
      .single();

    if (insertError) {
      console.error('❌ [createCentroCusto] SQL error inserting:', insertError);
      return c.json(errorResponse('Erro ao criar centro de custo', { details: insertError.message }), 500);
    }

    logInfo(`✅ Centro de custo criado: ${id}`);

    return c.json({
      success: true,
      data: sqlToCentroCusto(insertedRow),
    }, 201);
  } catch (error: any) {
    logError('Erro ao criar centro de custo:', error);
    return c.json(errorResponse('Erro ao criar centro de custo', { details: error.message }), 500);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Atualizar saldo da conta bancária
 */
async function atualizarSaldoConta(contaId: string, tipo: string, valor: number) {
  try {
    const client = getSupabaseClient();
    
    // Buscar conta atual
    const { data: conta, error: fetchError } = await client
      .from('financeiro_contas_bancarias')
      .select('saldo_atual')
      .eq('id', contaId)
      .single();

    if (fetchError || !conta) {
      console.warn(`⚠️ [atualizarSaldoConta] Conta não encontrada: ${contaId}`);
      return;
    }

    // Calcular novo saldo
    let novoSaldo = Number(conta.saldo_atual);
    if (tipo === 'entrada') {
      novoSaldo += valor;
    } else if (tipo === 'saida') {
      novoSaldo -= valor;
    }

    // Atualizar saldo
    const { error: updateError } = await client
      .from('financeiro_contas_bancarias')
      .update({ saldo_atual: novoSaldo })
      .eq('id', contaId);

    if (updateError) {
      console.error(`❌ [atualizarSaldoConta] Erro ao atualizar saldo:`, updateError);
    } else {
      console.log(`✅ [atualizarSaldoConta] Saldo atualizado: ${contaId} = ${novoSaldo}`);
    }
  } catch (error) {
    console.error(`❌ [atualizarSaldoConta] Erro inesperado:`, error);
  }
}


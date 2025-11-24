/**
 * RENDIZY - Cache Buster
 * Força rebuild completo quando necessário
 * @version 1.0.103.314
 */

export const CACHE_BUSTER = {
  version: 'v1.0.103.322',
  buildDate: '2025-11-24T03:55:00.000Z',
  reason: '🚑 Hotfix: Login persistente + Plano de Contas (forçar rebuild)',
  changes: [
    '✅ Atualiza CACHE_BUSTER para quebrar cache do Vercel',
    '✅ Refatora geração de hash para novo build',
    '✅ Garante que StaysNetIntegration use useMemo em produção',
    '✅ Hotfix crítico para tela financeira / plano de contas',
    '✅ Obrigatório limpar cache do CDN e do navegador',
  ],
};

export default CACHE_BUSTER;

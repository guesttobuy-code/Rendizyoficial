# AI Workflow and Single-Persona Governance

Objetivo: garantir um fluxo linear e previsível para mudanças geradas por agentes (IA ou humanos). Use este documento como referência rápida para instruções que todo agente deve seguir.

- **Uma persona por tarefa**: atribua uma única persona/IA responsável por implementar e testar uma alteração do início ao fim. Evite alternar agentes no meio de uma investigação.
- **Branches de snapshot**: quando fizer investigações ou mudanças arriscadas, crie uma branch com prefixo `snapshot/` ou `investigation/` e empurre para revisão antes de mesclar.
- **PR obrigatório para merges**: mudanças devem passar por Pull Request com descrição, passos de teste e contexto.
- **Pequenos commits atômicos**: prefira commits pequenos e descritivos (ex: `fix(properties): save step mapping address`).
- **Checklist mínimo antes do push**:
  - Rodar o dev server localmente e verificar que a página abre.
  - Confirmar que alterações críticas (ex: persistência) foram testadas manualmente.
  - Adicionar ou atualizar testes se aplicável.

Passos ao concluir uma investigação técnica:
1. Criar branch `snapshot/<desc>-YYYYMMDD-HHMM`.
2. Aplicar mudanças mínimas que comprovem correção (não refatorações grandes sem PR separado).
3. Empurrar branch e abrir PR com: resumo, arquivos alterados, passos para testar, riscos e próximos passos.
4. Marcar revisores e aguardar aprovação antes de merge.

Este documento é um ponto de partida — adicione exemplos e políticas específicas no `CONTRIBUTING.md`.

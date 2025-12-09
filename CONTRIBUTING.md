# Contributing

Obrigado por contribuir com este repositório. Siga estas diretrizes para tornar revisões e merges previsíveis.

Branching
- Branches de features e correções devem seguir o padrão: `feat/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
- Para investigações e snapshots, use `snapshot/<desc>-YYYYMMDD-HHMM`.

Commits
- Use mensagens descritivas no formato: `type(scope): breve descrição` (ex: `fix(properties): map address in saveStep`).

Antes de abrir PR
- Execute o servidor de desenvolvimento e verifique que a aplicação inicia.
- Teste manualmente as mudanças críticas (ex.: fluxo de edição de propriedade).
- Adicione ou atualize testes se aplicável.

Hooks Git
- Este repositório inclui um hook de pre-push em `.githooks/pre-push` que bloqueia pushes acidentais. Para ativá-lo localmente execute:

```pwsh
pwsh ./scripts/install-git-hooks.ps1
```

O hook requer que a variável de ambiente `GIT_ALLOW_PUSH=true` esteja definida ou um arquivo vazio `.allow_push` exista na raiz para permitir o push.

Pull Requests
- Abra PRs pequenos e focados.
- Inclua no corpo do PR: resumo da mudança, passos de teste locais, riscos conhecidos e próximos passos sugeridos.

Revisão
- Marque 1-2 revisores e aguarde aprovação antes de mesclar.

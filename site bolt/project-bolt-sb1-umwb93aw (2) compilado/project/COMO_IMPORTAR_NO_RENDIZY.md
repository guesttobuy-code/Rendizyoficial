# Como Importar o Site MedHome no RENDIZY

## Opção 1: Repositório Git (Recomendado)

Se você tem o código em um repositório Git (GitHub, GitLab, Bitbucket):

1. Acesse o painel do RENDIZY
2. Vá em "Importar Site" ou "Novo Site"
3. Forneça a URL do repositório Git
4. O RENDIZY irá clonar e configurar automaticamente

**URL do Repositório:** `https://github.com/seu-usuario/medhome`

## Opção 2: Upload de Arquivo ZIP

Se o RENDIZY aceita upload de arquivos:

1. Baixe o arquivo `medhome-site.tar.gz` (localizado em `/tmp/cc-agent/59754659/`)
2. Ou crie um ZIP manualmente excluindo:
   - `node_modules/`
   - `dist/`
   - `.git/`
   - `.bolt/`

**Comando para criar ZIP:**
```bash
zip -r medhome-site.zip . -x "node_modules/*" "dist/*" ".git/*" ".bolt/*"
```

## Opção 3: Código via Interface Web

Se o RENDIZY tem um editor de código integrado, você precisará copiar os arquivos principais:

### Estrutura de Pastas Essenciais

```
medhome/
├── src/
│   ├── components/
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── WhatsAppButton.tsx
│   ├── pages/
│   │   ├── AboutPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── PropertiesPage.tsx
│   │   └── PropertyDetailPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── site.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── medhome_logo_hibrida_vertical logo oficial.png
│   └── medhome_logo_icone.png
├── supabase/
│   └── migrations/
│       ├── 20251114185059_create_medhome_schema.sql
│       └── 20251201135927_update_properties_rendizy_format.sql
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env (com suas variáveis)
```

## Opção 4: Integração Direta via API

Se o RENDIZY tem uma API para importar projetos:

1. Use o endpoint de importação
2. Envie o código via POST request
3. Configure as variáveis de ambiente

**Exemplo de Payload:**
```json
{
  "name": "MedHome",
  "type": "react-vite",
  "repository": "https://github.com/seu-usuario/medhome",
  "env": {
    "VITE_SUPABASE_URL": "sua-url",
    "VITE_SUPABASE_ANON_KEY": "sua-chave",
    "VITE_USE_RENDIZY_API": "true"
  }
}
```

## Arquivos de Configuração Importantes

### 1. package.json
Define as dependências e scripts do projeto.

### 2. .env
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_SUPABASE_PROJECT_ID=seu-projeto-id
VITE_USE_RENDIZY_API=true
```

### 3. src/config/site.ts
Configurações do site que serão substituídas pelo RENDIZY:
- organizationId
- subdomain
- domain
- logo/favicon
- theme (cores)
- API endpoints

## Variáveis que o RENDIZY Deve Substituir

O RENDIZY deve substituir automaticamente estas variáveis no código:

```typescript
// Em src/config/site.ts
{
  organizationId: "{{ORG_ID}}",           // UUID da organização
  subdomain: "{{SUBDOMAIN}}",             // Ex: medhome
  domain: "{{DOMAIN}}",                   // Ex: medhome.com.br
  logo: "{{LOGO_URL}}",                   // URL do logo
  favicon: "{{FAVICON_URL}}",             // URL do favicon
  theme: {
    primaryColor: "{{PRIMARY_COLOR}}",    // Ex: #5DBEBD
    secondaryColor: "{{SECONDARY_COLOR}}", // Ex: #FF8B94
    accentColor: "{{ACCENT_COLOR}}",      // Ex: #10B981
    fontFamily: "{{FONT_FAMILY}}"         // Ex: Inter, sans-serif
  },
  api: {
    projectId: "{{PROJECT_ID}}",          // ID do projeto Supabase
    baseUrl: "{{API_BASE_URL}}",          // URL base da API
    publicAnonKey: "{{PUBLIC_ANON_KEY}}"  // Chave pública
  }
}
```

## Após a Importação

1. Verifique se o RENDIZY substituiu todas as variáveis `{{VAR_NAME}}`
2. Configure o domínio (subdomain.rendizy.com.br ou customizado)
3. Ative a flag `VITE_USE_RENDIZY_API=true`
4. Teste o site importado
5. Configure as propriedades no painel RENDIZY

## Suporte

- Versão do Projeto: 1.1-2025-12-01
- Compatível com: RENDIZY API v1.1
- Framework: React 18 + Vite + TypeScript
- Database: Supabase (migrations incluídas)

## Checklist de Importação

- [ ] Código fonte enviado
- [ ] Variáveis substituídas
- [ ] Logos configurados
- [ ] Cores do tema definidas
- [ ] Domínio configurado
- [ ] API RENDIZY conectada
- [ ] Migrations do banco executadas
- [ ] Propriedades importadas
- [ ] Site testado e funcionando

---

**Dúvidas?** Entre em contato com o suporte do RENDIZY com este documento.

# MIGGRO - Plataforma de Apoio ao Imigrante

Plataforma social e marketplace para conectar imigrantes com serviços e ajuda na comunidade.

## 🚀 Tecnologias

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling:** Tailwind CSS
- **Deploy:** Vercel

## 📋 Funcionalidades

- ✅ Autenticação de usuários
- ✅ Feed social com posts e comentários
- ✅ Marketplace de serviços
- ✅ Sistema de grupos
- ✅ Chat em tempo real
- ✅ Sistema de notificações
- ✅ Reviews e avaliações
- ✅ Sistema de badges
- ✅ Moderação de conteúdo
- ✅ Dashboard do prestador
- ✅ Sistema de pagamentos

## 🛠️ Setup Local

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**

   Crie um arquivo `.env.local` com:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Iniciar servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

## 📦 Build para Produção

```bash
npm run build
```

## 🗄️ Database

As migrations SQL estão em `supabase/migrations/`. Aplique-as na ordem numérica no Supabase Dashboard.

## 📝 Licença

Proprietário - MIGGRO

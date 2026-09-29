# Artero Galeri

Galeria online conectada ao Google Drive. Suas fotos ficam no Drive, o app só indexa metadados e cria miniaturas.

## Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Auth**: Auth.js v5 (NextAuth) com Google OAuth
- **Database**: Postgres (Neon) + Drizzle ORM
- **Storage**: Cloudflare R2 (miniaturas)
- **UI**: Tailwind v4 + shadcn/ui (Radix) + lucide-react
- **State**: TanStack Query + Zustand

## Visualizações

- Masonry / Grid
- Linhas Justificadas (estilo Google Photos)
- Timeline por data (EXIF)
- Apresentação / Lightbox
- Árvore de pastas
- Mapa geográfico (OpenStreetMap)

## Controle de Acesso

- Público (indexável)
- Link não listado (secreto)
- Senha por galeria
- Lista de e-mails permitidos (OTP)
- Expiração opcional
- Download permitido/bloqueado
- Resolução máxima configurável

## Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Gerar schema do banco
npm run db:generate
npm run db:push

# Desenvolvimento
npm run dev
```

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. Principais:

- `DATABASE_URL` - Connection string do Neon
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - OAuth Google
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` - Cloudflare R2
- `TOKEN_ENCRYPTION_KEY` - `openssl rand -base64 32`
- `GALLERY_JWT_SECRET` - `openssl rand -base64 48`

## Google Cloud Setup

1. Criar projeto no Google Cloud Console
2. Habilitar Google Drive API
3. OAuth Consent Screen → External → Publicar (não verificado)
4. Criar OAuth 2.0 Client ID (Web)
5. Redirect URI: `https://seu-dominio/api/auth/callback/google`
6. Scopes: `drive.readonly`, `userinfo.email`, `userinfo.profile`

## Deploy

Vercel + Neon + Cloudflare R2 (todos com free tier generoso).

## Licença

MIT
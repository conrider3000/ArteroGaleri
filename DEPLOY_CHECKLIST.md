# Artero Galeri - Checklist de Deploy

## ✅ Feito (Automático via GitHub Actions)
- [x] Lint + TypeCheck + Testes no push/PR
- [x] Build no push para main
- [x] Deploy preview no PR
- [x] Deploy produção no push para main
- [x] Migration automática (`drizzle-kit migrate`) no deploy produção

---

## 🔧 O que VOCÊ precisa fazer MANUALMENTE (uma vez só)

### 1. Google Cloud Console
- [ ] Criar projeto: https://console.cloud.google.com
- [ ] **APIs & Services → Library → Google Drive API → Enable**
- [ ] **OAuth consent screen**:
  - [ ] User Type: **External**
  - [ ] App name: "Artero Galeri"
  - [ ] User support email: seu email
  - [ ] Developer contact: seu email
  - [ ] **Save** → **Add scope**: `.../auth/drive.readonly`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
  - [ ] Test users: **adicione seu email**
  - [ ] **Publish App** → **Confirm** (fica "Unverified" — OK)
- [ ] **Credentials → Create Credentials → OAuth client ID**:
  - [ ] Application type: **Web application**
  - [ ] Name: "Artero Galeri Vercel"
  - [ ] **Authorized redirect URIs** (adicione as 2):
    - `http://localhost:3000/api/auth/callback/google`
    - `https://SEU-PROJETO.vercel.app/api/auth/callback/google` (atualize após deploy)
  - [ ] Create → **COPIE Client ID e Client Secret**

### 2. Neon (Postgres)
- [ ] Acesse https://neon.tech → Create project
- [ ] Nome: `artero-galeri`
- [ ] Region: mais perto de você (ex: `us-east-1` ou `sa-east-1`)
- [ ] **Copy connection string** (pooled):
  ```
  postgresql://user:pass@ep-xxx.region.aws.neon.tech/artero?sslmode=require
  ```
- [ ] (Opcional) Create branch `preview` para PRs

### 3. Cloudflare R2
- [ ] Acesse https://dash.cloudflare.com → R2 → Create bucket
- [ ] Bucket name: `artero-galeri`
- [ ] **Settings → Allow public access** (ou configure custom domain depois)
- [ ] **R2 → Manage R2 API tokens → Create API token**:
  - Permissions: **Object Read & Write**
  - **COPIE**: Account ID, Access Key ID, Secret Access Key
- [ ] **Public URL**: `https://pub-xxx.r2.dev` (ou seu custom domain)

### 4. Gerar Secrets Locais
```bash
# Rode no terminal (Linux/Mac/Git Bash):
openssl rand -base64 32  # TOKEN_ENCRYPTION_KEY
openssl rand -base64 48  # GALLERY_JWT_SECRET
openssl rand -base64 32  # AUTH_SECRET
```
- [ ] TOKEN_ENCRYPTION_KEY (32 bytes base64)
- [ ] GALLERY_JWT_SECRET (48 bytes base64)
- [ ] AUTH_SECRET (32 bytes base64)

### 5. GitHub Repository Secrets
Vá em: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://...` (Neon) |
| `AUTH_GOOGLE_ID` | `xxx.apps.googleusercontent.com` |
| `AUTH_GOOGLE_SECRET` | `GOCSPX-xxx` |
| `R2_ACCOUNT_ID` | `xxx` |
| `R2_ACCESS_KEY_ID` | `xxx` |
| `R2_SECRET_ACCESS_KEY` | `xxx` |
| `R2_BUCKET_NAME` | `artero-galeri` |
| `R2_PUBLIC_URL` | `https://pub-xxx.r2.dev` |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `GALLERY_JWT_SECRET` | `openssl rand -base64 48` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-PROJETO.vercel.app` |
| `VERCEL_TOKEN` | (gere em https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | (pegue em Vercel Settings → General) |
| `VERCEL_PROJECT_ID` | (pegue em Vercel Project Settings) |

### 6. Vercel
- [ ] Acesse https://vercel.com/dashboard → Add New Project → Import `conrider3000/ArteroGaleri`
- [ ] Framework: **Next.js** (auto)
- [ ] **Environment Variables**: adicione TODAS as mesmas do GitHub Secrets (exceto VERCEL_*)
- [ ] **Deploy** → espera build passar
- [ ] **Settings → Domains** → copie a **Production Domain** (ex: `https://artero-galeri.vercel.app`)

### 7. Atualizar Google OAuth Redirect
- [ ] Volte no **Google Cloud Console → Credentials** → edite o OAuth Client
- [ ] Adicione: `https://SUA-URL-VERCEL.vercel.app/api/auth/callback/google`
- [ ] Save

### 8. Redeploy Vercel (se mudou NEXT_PUBLIC_APP_URL)
- [ ] Vercel → Deployments → **Redeploy** último

### 9. Testar
- [ ] Acesse `https://SUA-URL.vercel.app`
- [ ] Clique **"Começar"** → Conecta Google → Autoriza
- [ ] Vai para `/admin/galleries` → **"Nova Galeria"**
- [ ] Escolhe pasta do Drive → Configura acesso → **Criar**
- [ ] Clica **"Sync"** → espera indexar
- [ ] Abre `/g/seu-slug` → vê a galeria

---

## 🔄 Pós-deploy (opcional)

### Custom Domain (se quiser)
- [ ] Vercel → Settings → Domains → Add `galeri.seudominio.com`
- [ ] Configure DNS (CNAME para `cname.vercel-dns.com`)
- [ ] Atualize `NEXT_PUBLIC_APP_URL` e Google OAuth redirect

### R2 Custom Domain (se quiser)
- [ ] Cloudflare → R2 → Bucket → Settings → Custom Domain
- [ ] Adicione `img.seudominio.com`
- [ ] Atualize `R2_PUBLIC_URL=https://img.seudominio.com`

### Monitoramento
- [ ] Vercel Analytics (grátis)
- [ ] Neon Monitoring (grátis)
- [ ] Cloudflare R2 Analytics (grátis)

---

## 📝 Comandos Úteis

```bash
# Local dev
./scripts/setup-local.ps1   # Windows
./scripts/setup-local.sh    # Linux/Mac

# DB
npm run db:generate         # Gera migrações
npm run db:push             # Aplica no banco (dev)
npm run db:migrate          # Aplica migrações (prod)
npm run db:studio           # Abre Drizzle Studio

# Vercel CLI
vercel login
vercel env pull .env.local  # Baixa env vars do Vercel
vercel logs <deployment-url>
```

---

## 🆘 Troubleshooting

| Erro | Solução |
|---|---|
| `DATABASE_URL` not set | Verifique se secret está no GitHub/Vercel |
| `Invalid redirect_uri` | Google OAuth redirect deve bater exatamente com `NEXT_PUBLIC_APP_URL/api/auth/callback/google` |
| `R2 Access Denied` | Verifique se token tem permissão Read/Write no bucket |
| `Token encryption failed` | `TOKEN_ENCRYPTION_KEY` deve ter 32 bytes base64 |
| Build falha no `db:push` | `DATABASE_URL` deve ser connection string pooled do Neon |

---

## 📞 Próximos passos após tudo funcionando

1. Crie suas primeiras galerias no `/admin`
2. Teste todos os 6 modos de visualização
3. Configure senhas / e-mails permitidos / expiração
4. Compartilhe links com quem quiser
5. Monitore uso no Vercel/Neon/R2 dashboards
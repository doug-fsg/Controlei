# 🚀 Setup do Sistema Financeiro

## 📋 Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Portainer (para deploy)

## 🎯 Passo a Passo

### 1️⃣ Configurar Prisma e Banco
```bash
# Instalar dependências
npm install @prisma/client
npm install prisma --save-dev

# Inicializar Prisma com PostgreSQL
npx prisma init --datasource-provider postgresql

# Copiar schema do Prisma (ver abaixo)
# Cole o conteúdo em prisma/schema.prisma

# Criar primeira migration
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate
```

### 2️⃣ Configurar Autenticação
```bash
# Instalar NextAuth.js
npm install next-auth
npm install @auth/prisma-adapter
```

### 3️⃣ Configurar Variáveis de Ambiente
Crie/atualize o arquivo `.env`:
```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/sistema_financeiro"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Google Auth (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 4️⃣ Docker para Desenvolvimento
```bash
# Iniciar banco de dados
docker-compose -f docker-compose.dev.yml up -d

# Rodar migrations
npx prisma migrate deploy

# Iniciar aplicação
npm run dev
```

### 5️⃣ Docker para Produção
```bash
# Build e deploy
docker-compose up -d --build
```

## 📁 Estrutura de Arquivos Adicionada

```
sistema-financeiro/
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   └── migrations/        # Migrations geradas
├── src/
│   ├── app/
│   │   └── api/          # API Routes
│   │       ├── auth/     # Autenticação
│   │       ├── clients/  # CRUD Clientes
│   │       ├── sales/    # CRUD Vendas
│   │       └── expenses/ # CRUD Despesas
│   └── lib/
│       ├── prisma.ts     # Cliente Prisma
│       └── auth.ts       # Config NextAuth
├── docker-compose.yml     # Produção
├── docker-compose.dev.yml # Desenvolvimento
└── Dockerfile            # Build produção
```

## 🐳 Docker Compose Dev
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=sistema_financeiro
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔄 Scripts NPM Úteis
Adicione ao `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy"
  }
}
```

## 🚀 Deploy em Produção

1. No Portainer:
   - Criar nova Stack
   - Colar conteúdo do `docker-compose.yml`
   - Configurar variáveis de ambiente
   - Deploy!

2. Verificar:
   - Logs do container
   - Conexão com banco
   - Migrations aplicadas

## ⚠️ Importante
- Sempre faça backup do banco antes de migrations
- Use secrets para senhas em produção
- Configure CORS adequadamente
- Implemente rate limiting nas APIs
- Monitore uso de recursos

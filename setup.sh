#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Iniciando setup do Sistema Financeiro...${NC}\n"

# Instalar dependências
echo -e "${GREEN}📦 Instalando dependências...${NC}"
npm install @prisma/client next-auth @auth/prisma-adapter zod
npm install --save-dev prisma

# Criar diretórios necessários
echo -e "${GREEN}📁 Criando estrutura de diretórios...${NC}"
mkdir -p src/app/api/{auth,clients,sales,expenses}
mkdir -p src/lib
mkdir -p docker

# Criar arquivo de configuração do Prisma
echo -e "${GREEN}🗄️ Configurando Prisma...${NC}"
cat > prisma/schema.prisma << EOL
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Schema será adicionado via migration
EOL

# Criar arquivo de ambiente
echo -e "${GREEN}⚙️ Criando arquivo .env...${NC}"
cat > .env << EOL
# Ambiente
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sistema_financeiro"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Google (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EOL

# Criar docker-compose para desenvolvimento
echo -e "${GREEN}🐳 Criando docker-compose.dev.yml...${NC}"
cat > docker-compose.dev.yml << EOL
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
EOL

# Criar docker-compose para produção
echo -e "${GREEN}🚀 Criando docker-compose.yml...${NC}"
cat > docker-compose.yml << EOL
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/sistema_financeiro
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=\${NEXTAUTH_URL}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sistema_financeiro
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOL

# Criar Dockerfile
echo -e "${GREEN}📄 Criando Dockerfile...${NC}"
cat > docker/Dockerfile << EOL
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOL

# Criar arquivo de configuração do Nginx
echo -e "${GREEN}🔧 Criando nginx.conf...${NC}"
cat > docker/nginx.conf << EOL
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
        }
    }
}
EOL

# Atualizar package.json com scripts
echo -e "${GREEN}📝 Atualizando scripts no package.json...${NC}"
npm pkg set scripts.dev="next dev"
npm pkg set scripts.build="prisma generate && next build"
npm pkg set scripts.start="next start"
npm pkg set scripts.db:studio="prisma studio"
npm pkg set scripts.db:push="prisma db push"
npm pkg set scripts.db:migrate="prisma migrate deploy"
npm pkg set scripts.docker:dev="docker-compose -f docker-compose.dev.yml up -d"
npm pkg set scripts.docker:build="docker-compose build"
npm pkg set scripts.docker:up="docker-compose up -d"

# Criar arquivo do cliente Prisma
echo -e "${GREEN}📝 Criando cliente Prisma...${NC}"
cat > src/lib/prisma.ts << EOL
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOL

echo -e "\n${BLUE}✨ Setup concluído! Próximos passos:${NC}"
echo -e "1. Revise e ajuste as variáveis em .env"
echo -e "2. Execute: npm run docker:dev"
echo -e "3. Execute: npx prisma migrate dev"
echo -e "4. Execute: npm run dev"
echo -e "\n${BLUE}🎉 Bom desenvolvimento!${NC}"

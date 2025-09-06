# Dockerfile para produção
FROM node:18-alpine AS base

# Instalar dependências apenas quando necessário
FROM base AS deps
# Verificar https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine para entender por que libc6-compat pode ser necessário.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências baseado no gerenciador de pacotes preferido
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --omit=dev && npm cache clean --force

# Reconstruir o código fonte apenas quando necessário
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Instalar dependências de dev para build
RUN npm install

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Imagem de produção, copiar todos os arquivos e executar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Desabilitar telemetria durante o runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários para produção
COPY --from=builder /app/public ./public

# Usar output standalone para otimizar o tamanho da imagem
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar arquivos do Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para executar a aplicação
CMD ["node", "server.js"]

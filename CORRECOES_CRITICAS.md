# 🔧 Correções Críticas - Guia de Implementação

Este documento fornece instruções passo a passo para corrigir as vulnerabilidades críticas identificadas.

---

## 1. Corrigir Autorização em `/api/clients/[id]`

### Arquivo: `src/app/api/clients/[id]/route.ts`

**Substituir TODAS as ocorrências de:**
```typescript
// TODO: Pegar userId da sessão
const userId = 1
```

**Por:**
```typescript
const userId = await requireAuth()
const organization = await getCurrentOrganization()

if (!organization) {
  return NextResponse.json(
    { error: 'Organização não encontrada' },
    { status: 400 }
  )
}
```

**E atualizar todas as queries para incluir `organizationId`:**
```typescript
const client = await prisma.client.findFirst({
  where: {
    id: parseInt(id),
    organizationId: organization.id, // ✅ Adicionar esta verificação
  },
})
```

**Aplicar em 3 funções:**
- `GET` (linha ~22)
- `PUT` (linha ~61)
- `DELETE` (linha ~112)

---

## 2. Adicionar Verificação de Organização em Vendas

### Arquivo: `src/app/api/sales/[id]/route.ts`

**Na função GET (linha ~29):**
```typescript
// ANTES
const sale = await prisma.sale.findFirst({
  where: {
    id: saleId,
    userId,
  },
})

// DEPOIS
const userId = await requireAuth()
const organization = await getCurrentOrganization()

if (!organization) {
  return NextResponse.json(
    { error: 'Organização não encontrada' },
    { status: 400 }
  )
}

const sale = await prisma.sale.findFirst({
  where: {
    id: saleId,
    organizationId: organization.id, // ✅ Adicionar
  },
})
```

**Aplicar o mesmo padrão em PUT e DELETE.**

---

## 3. Implementar Rate Limiting

### Passo 1: Instalar dependência
```bash
npm install @upstash/ratelimit @upstash/redis
```

### Passo 2: Criar arquivo `src/lib/ratelimit.ts`
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 requisições por 10 minutos
  analytics: true,
})

export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requisições por minuto
  analytics: true,
})
```

### Passo 3: Adicionar ao `.env`
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Passo 4: Aplicar em `src/app/api/auth/register/route.ts`
```typescript
import { authRatelimit } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  // Adicionar no início da função
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success, limit, reset, remaining } = await authRatelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfter: Math.round((reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }
  
  // ... resto do código
}
```

**Aplicar o mesmo em:**
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

---

## 4. Corrigir Logs de SQL

### Arquivo: `src/lib/prisma.ts`

**Substituir:**
```typescript
log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
```

**Por:**
```typescript
log: 
  process.env.NODE_ENV === 'production' 
    ? ['error'] 
    : process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'], // Default seguro - nunca logar queries em produção
```

---

## 5. Fortalecer Política de Senhas

### Arquivo: `src/app/api/auth/register/route.ts`

**Substituir o schema:**
```typescript
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})
```

**Por:**
```typescript
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
})
```

**Aplicar o mesmo em `src/app/api/auth/reset-password/route.ts`**

---

## 6. Padronizar Mensagens de Erro

### Criar arquivo `src/lib/errors.ts`
```typescript
export const ErrorMessages = {
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso negado',
  NOT_FOUND: 'Recurso não encontrado',
  VALIDATION_ERROR: 'Dados inválidos',
  INTERNAL_ERROR: 'Erro interno do servidor',
  RATE_LIMIT: 'Muitas tentativas. Tente novamente mais tarde.',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  GENERIC_ERROR: 'Não foi possível processar sua solicitação',
} as const
```

### Exemplo de uso em `src/app/api/auth/register/route.ts`
```typescript
import { ErrorMessages } from '@/lib/errors'

// ❌ ANTES
if (existingUser) {
  return NextResponse.json(
    { error: 'Usuário já existe com este email' },
    { status: 400 }
  )
}

// ✅ DEPOIS
if (existingUser) {
  return NextResponse.json(
    { error: ErrorMessages.GENERIC_ERROR },
    { status: 400 }
  )
}
```

---

## 7. Adicionar Headers de Segurança

### Arquivo: `next.config.ts`

**Adicionar função de headers:**
```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  // ... resto da configuração existente
}

export default nextConfig
```

---

## 📝 Checklist de Implementação

### Fase 1 - Crítico (Fazer AGORA)
- [ ] Corrigir `/api/clients/[id]` - remover userId hardcoded
- [ ] Adicionar verificação de organização em `/api/sales/[id]`
- [ ] Corrigir logs de SQL em produção
- [ ] Implementar rate limiting básico

### Fase 2 - Alta Prioridade (Esta semana)
- [ ] Fortalecer política de senhas
- [ ] Padronizar mensagens de erro
- [ ] Adicionar headers de segurança
- [ ] Melhorar validação de upload

### Fase 3 - Testes
- [ ] Testar todas as correções
- [ ] Verificar que não quebrou funcionalidades existentes
- [ ] Testar rate limiting
- [ ] Verificar logs em produção

---

## ⚠️ Importante

1. **Teste cada correção individualmente** antes de aplicar a próxima
2. **Faça backup do banco de dados** antes de aplicar mudanças
3. **Teste em ambiente de desenvolvimento** primeiro
4. **Monitore logs** após deploy em produção
5. **Revise todas as rotas** para garantir consistência

---

## 🚀 Ordem Recomendada de Implementação

1. **Primeiro:** Corrigir logs de SQL (mais rápido e seguro)
2. **Segundo:** Corrigir autorização em clients (crítico)
3. **Terceiro:** Adicionar verificação de organização em sales
4. **Quarto:** Implementar rate limiting
5. **Quinto:** Fortalecer senhas
6. **Sexto:** Padronizar erros
7. **Sétimo:** Adicionar headers de segurança

---

**Tempo estimado total:** 4-6 horas de desenvolvimento + 2 horas de testes


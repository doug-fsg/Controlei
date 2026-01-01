# 🔒 Relatório de Vulnerabilidades de Segurança

**Data da Análise:** $(date)  
**Sistema:** Sistema Financeiro  
**Versão:** 0.1.0

---

## 📊 Resumo Executivo

Este relatório documenta as vulnerabilidades de segurança identificadas no sistema financeiro. As vulnerabilidades foram classificadas por severidade (Crítica, Alta, Média, Baixa) e incluem recomendações de correção.

**Total de Vulnerabilidades Encontradas:** 15

- 🔴 **Críticas:** 4
- 🟠 **Altas:** 5
- 🟡 **Médias:** 4
- 🟢 **Baixas:** 2

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. **Autorização Bypass em `/api/clients/[id]` - Hardcoded User ID**

**Severidade:** 🔴 CRÍTICA  
**Arquivo:** `src/app/api/clients/[id]/route.ts`  
**Linhas:** 22, 61, 112

**Descrição:**
As rotas GET, PUT e DELETE em `/api/clients/[id]` usam um `userId` hardcoded (`const userId = 1`) em vez de obter o ID do usuário autenticado da sessão.

**Impacto:**
- Qualquer usuário autenticado pode acessar, modificar ou deletar clientes de outros usuários
- Violação completa de isolamento de dados multi-tenant
- Possível acesso não autorizado a dados sensíveis de clientes

**Código Vulnerável:**
```typescript
// TODO: Pegar userId da sessão
const userId = 1
```

**Correção Recomendada:**
```typescript
const userId = await requireAuth()
const organization = await getCurrentOrganization()

if (!organization) {
  return NextResponse.json(
    { error: 'Organização não encontrada' },
    { status: 400 }
  )
}

const client = await prisma.client.findFirst({
  where: {
    id: parseInt(id),
    organizationId: organization.id, // Verificar organização também
  },
})
```

---

### 2. **Falta de Verificação de Organização em Rotas de Vendas**

**Severidade:** 🔴 CRÍTICA  
**Arquivo:** `src/app/api/sales/[id]/route.ts`  
**Linhas:** 40-44, 100-105, 272-277

**Descrição:**
As rotas GET, PUT e DELETE verificam apenas `userId`, mas não verificam se a venda pertence à organização do usuário. Isso permite que usuários de uma organização acessem vendas de outras organizações.

**Impacto:**
- Acesso não autorizado a dados financeiros de outras organizações
- Possibilidade de modificar ou deletar vendas de outras empresas
- Violação de isolamento multi-tenant

**Código Vulnerável:**
```typescript
const sale = await prisma.sale.findFirst({
  where: {
    id: saleId,
    userId, // ❌ Falta verificação de organizationId
  },
})
```

**Correção Recomendada:**
```typescript
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
    organizationId: organization.id, // ✅ Verificar organização
  },
})
```

---

### 3. **Rate Limiting Ausente em Endpoints Críticos**

**Severidade:** 🔴 CRÍTICA  
**Arquivos:** 
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

**Descrição:**
Endpoints de autenticação não possuem rate limiting, permitindo ataques de força bruta e enumeração de usuários.

**Impacto:**
- Ataques de força bruta em login e reset de senha
- Enumeração de emails válidos através de tentativas de registro
- Possível negação de serviço (DoS)
- Criação massiva de contas falsas

**Correção Recomendada:**
Implementar rate limiting usando bibliotecas como `@upstash/ratelimit` ou `next-rate-limit`:

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 requisições por 10 minutos
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 }
    )
  }
  
  // ... resto do código
}
```

---

### 4. **Logs de Queries SQL em Produção**

**Severidade:** 🔴 CRÍTICA  
**Arquivo:** `src/lib/prisma.ts`  
**Linha:** 10

**Descrição:**
O Prisma está configurado para logar queries SQL em desenvolvimento, mas pode expor informações sensíveis se `NODE_ENV` não estiver configurado corretamente.

**Impacto:**
- Exposição de queries SQL contendo dados sensíveis em logs
- Possível vazamento de credenciais ou dados pessoais
- Informações sobre estrutura do banco de dados

**Código Vulnerável:**
```typescript
log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
```

**Correção Recomendada:**
```typescript
log: process.env.NODE_ENV === 'production' 
  ? ['error'] 
  : process.env.NODE_ENV === 'development'
  ? ['query', 'error', 'warn']
  : ['error'], // Default seguro
```

---

## 🟠 VULNERABILIDADES ALTAS

### 5. **Validação Insuficiente de Upload de Arquivos**

**Severidade:** 🟠 ALTA  
**Arquivo:** `src/app/api/organizations/logo/route.ts`  
**Linhas:** 54-72, 83-92

**Descrição:**
Embora existam validações de tipo e tamanho, faltam verificações adicionais:
- Não há verificação de dimensões da imagem (pode ser muito grande em pixels)
- Não há sanitização completa do conteúdo do arquivo
- Validação de magic bytes pode ser melhorada

**Impacto:**
- Possível upload de arquivos maliciosos disfarçados como imagens
- Consumo excessivo de recursos do servidor
- Possível DoS através de uploads grandes

**Correção Recomendada:**
```typescript
import sharp from 'sharp'

// Validar dimensões e redimensionar
const image = sharp(buffer)
const metadata = await image.metadata()

if (metadata.width > 2000 || metadata.height > 2000) {
  return NextResponse.json(
    { error: 'Imagem muito grande. Máximo 2000x2000px' },
    { status: 400 }
  )
}

// Redimensionar e otimizar
const optimizedBuffer = await image
  .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer()
```

---

### 6. **Falta de CSRF Protection**

**Severidade:** 🟠 ALTA  
**Arquivos:** Todas as rotas POST/PUT/DELETE

**Descrição:**
O sistema não implementa proteção CSRF (Cross-Site Request Forgery) para rotas que modificam dados.

**Impacto:**
- Ataques CSRF podem executar ações não autorizadas em nome do usuário
- Possível criação/modificação/deleção de dados sem consentimento
- Vulnerabilidade especialmente crítica em operações financeiras

**Correção Recomendada:**
NextAuth.js já fornece proteção CSRF para rotas de autenticação. Para outras rotas, implementar tokens CSRF:

```typescript
import { csrf } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  // Verificar token CSRF
  const csrfToken = request.headers.get('X-CSRF-Token')
  if (!csrfToken || !csrf.validate(csrfToken)) {
    return NextResponse.json(
      { error: 'Token CSRF inválido' },
      { status: 403 }
    )
  }
  
  // ... resto do código
}
```

---

### 7. **Senha Mínima Muito Fraca**

**Severidade:** 🟠 ALTA  
**Arquivo:** `src/app/api/auth/register/route.ts`  
**Linha:** 9

**Descrição:**
A validação de senha permite apenas 6 caracteres mínimos, o que é considerado inseguro.

**Impacto:**
- Senhas fracas são vulneráveis a ataques de força bruta
- Maior risco de comprometimento de contas

**Código Vulnerável:**
```typescript
password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
```

**Correção Recomendada:**
```typescript
password: z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
```

---

### 8. **Token de Reset de Senha Não Expira Corretamente**

**Severidade:** 🟠 ALTA  
**Arquivo:** `src/app/api/auth/reset-password/route.ts`  
**Linhas:** 28-39

**Descrição:**
Embora o token expire em 1 hora, não há verificação de uso único. Um token pode ser usado múltiplas vezes até expirar.

**Impacto:**
- Se um token for interceptado, pode ser usado várias vezes
- Maior janela de ataque para comprometimento de contas

**Correção Recomendada:**
```typescript
// Após resetar senha, invalidar TODOS os tokens do usuário
await prisma.verificationToken.deleteMany({
  where: { identifier: user.email },
})

// Ou adicionar campo 'used' ao modelo VerificationToken
```

---

### 9. **Exposição de Informações em Mensagens de Erro**

**Severidade:** 🟠 ALTA  
**Arquivos:** Múltiplos arquivos de API

**Descrição:**
Mensagens de erro podem expor informações sobre a estrutura do sistema, existência de recursos, etc.

**Exemplos:**
- `src/app/api/auth/register/route.ts`: "Usuário já existe com este email" - permite enumeração
- `src/app/api/clients/[id]/route.ts`: Mensagens detalhadas sobre estrutura de dados

**Impacto:**
- Enumeração de usuários e recursos
- Informações sobre estrutura do banco de dados
- Facilita ataques direcionados

**Correção Recomendada:**
Padronizar mensagens de erro genéricas:

```typescript
// ❌ Ruim
if (existingUser) {
  return NextResponse.json(
    { error: 'Usuário já existe com este email' },
    { status: 400 }
  )
}

// ✅ Bom
if (existingUser) {
  return NextResponse.json(
    { error: 'Não foi possível processar sua solicitação' },
    { status: 400 }
  )
}
```

---

## 🟡 VULNERABILIDADES MÉDIAS

### 10. **Falta de Validação de Entrada em Números**

**Severidade:** 🟡 MÉDIA  
**Arquivos:** Múltiplos arquivos de API

**Descrição:**
Validações de números não verificam limites máximos, permitindo valores extremamente grandes que podem causar overflow ou problemas de performance.

**Exemplo:**
```typescript
totalAmount: z.number().positive('Valor deve ser positivo'),
// ❌ Não há limite máximo
```

**Correção Recomendada:**
```typescript
totalAmount: z.number()
  .positive('Valor deve ser positivo')
  .max(999999999.99, 'Valor muito alto'),
```

---

### 11. **Falta de Sanitização em Campos de Texto**

**Severidade:** 🟡 MÉDIA  
**Arquivos:** Múltiplos arquivos de API

**Descrição:**
Campos de texto como `notes`, `description`, `address` não são sanitizados antes de serem salvos no banco, permitindo possível XSS armazenado.

**Impacto:**
- Possível XSS se dados forem renderizados sem escape no frontend
- Injeção de scripts maliciosos

**Correção Recomendada:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

const sanitizedNotes = DOMPurify.sanitize(validatedData.notes || '')
```

---

### 12. **Configuração Insegura de NextAuth**

**Severidade:** 🟡 MÉDIA  
**Arquivo:** `src/lib/auth.ts`  
**Linha:** 9

**Descrição:**
`trustHost: true` pode ser inseguro se não configurado corretamente com headers de proxy.

**Impacto:**
- Possível spoofing de host
- Vulnerabilidade a ataques de host header injection

**Correção Recomendada:**
```typescript
trustHost: process.env.NODE_ENV === 'production' 
  ? process.env.AUTH_TRUST_HOST === 'true'
  : true,
```

E configurar corretamente os headers de proxy no servidor.

---

### 13. **Falta de Headers de Segurança HTTP**

**Severidade:** 🟡 MÉDIA  
**Arquivo:** `next.config.ts`

**Descrição:**
Faltam headers de segurança HTTP como HSTS, X-Frame-Options, Content-Security-Policy globais.

**Correção Recomendada:**
```typescript
// next.config.ts
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
  // ... resto da configuração
}
```

---

## 🟢 VULNERABILIDADES BAIXAS

### 14. **Secrets Hardcoded em Docker Compose**

**Severidade:** 🟢 BAIXA  
**Arquivo:** `docker-compose.yml`  
**Linhas:** 15-16, 45-46

**Descrição:**
Credenciais de banco de dados e secrets estão hardcoded no arquivo docker-compose.yml.

**Impacto:**
- Se o arquivo for versionado, credenciais ficam expostas
- Dificulta rotação de credenciais

**Correção Recomendada:**
Usar variáveis de ambiente e arquivo `.env`:

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

---

### 15. **Falta de Validação de Timezone em Datas**

**Severidade:** 🟢 BAIXA  
**Arquivos:** Múltiplos arquivos de API

**Descrição:**
Datas são processadas sem validação de timezone, o que pode causar inconsistências.

**Correção Recomendada:**
```typescript
import { z } from 'zod'

const dateSchema = z.string().datetime().refine((date) => {
  const d = new Date(date)
  return !isNaN(d.getTime())
}, 'Data inválida')
```

---

## 📋 Checklist de Correções Prioritárias

### Crítico (Corrigir Imediatamente)
- [ ] Corrigir hardcoded userId em `/api/clients/[id]`
- [ ] Adicionar verificação de organização em rotas de vendas
- [ ] Implementar rate limiting em endpoints de autenticação
- [ ] Corrigir logs de SQL em produção

### Alta Prioridade (Corrigir em 1 semana)
- [ ] Melhorar validação de upload de arquivos
- [ ] Implementar proteção CSRF
- [ ] Fortalecer política de senhas
- [ ] Implementar uso único de tokens de reset
- [ ] Padronizar mensagens de erro

### Média Prioridade (Corrigir em 1 mês)
- [ ] Adicionar limites máximos em validações numéricas
- [ ] Implementar sanitização de entrada
- [ ] Revisar configuração do NextAuth
- [ ] Adicionar headers de segurança HTTP

### Baixa Prioridade (Melhorias)
- [ ] Remover secrets hardcoded
- [ ] Adicionar validação de timezone

---

## 🔧 Ferramentas Recomendadas

1. **Rate Limiting:** `@upstash/ratelimit` ou `next-rate-limit`
2. **CSRF Protection:** `csrf` ou usar proteção nativa do NextAuth
3. **Input Sanitization:** `isomorphic-dompurify` ou `dompurify`
4. **Image Processing:** `sharp` para validação e otimização de imagens
5. **Security Headers:** Configurar no `next.config.ts`
6. **Dependency Scanning:** `npm audit` ou `snyk`
7. **SAST:** `semgrep` ou `sonarqube`

---

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#security)

---

**Nota:** Este relatório foi gerado através de análise estática de código. Recomenda-se realizar testes de penetração e revisão de código adicional antes do deploy em produção.


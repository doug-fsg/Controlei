# 🚀 Quickstart - Sistema Financeiro

## ⚡ Tudo pronto! Vamos testar:

### 1️⃣ Subir o banco de dados
```bash
npm run docker:dev
```

### 2️⃣ Criar as tabelas
```bash
npx prisma migrate dev --name init
```

### 3️⃣ Executar a aplicação
```bash
npm run dev
```

### 4️⃣ Testar as APIs

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Criar categoria:**
```bash
curl -X POST http://localhost:3000/api/expenses/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Projetos"}'
```

**Criar cliente:**
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name": "João Silva", "email": "joao@teste.com"}'
```

**Listar clientes:**
```bash
curl http://localhost:3000/api/clients
```

### 5️⃣ Acessar Prisma Studio
```bash
npm run db:studio
```
Acesse: http://localhost:5555

## 🎯 APIs Disponíveis

- **Clientes**: `/api/clients`
- **Vendas**: `/api/sales`
- **Pagamentos**: `/api/sales/payments/[id]`
- **Categorias**: `/api/expenses/categories`
- **Despesas**: `/api/expenses`
- **Health**: `/api/health`

## 🐳 Deploy com Docker

Para deploy completo (app + banco):
```bash
npm run docker:build
npm run docker:up
```

## 📊 Monitoramento

- **Logs**: `docker-compose logs -f`
- **Health**: `curl http://localhost:3000/api/health`
- **Database**: Prisma Studio

## 🔥 Próximos passos

1. ✅ Backend e banco criados
2. ⏳ Conectar frontend com APIs
3. ⏳ Implementar autenticação
4. ⏳ Deploy em produção

**Tudo funcionando!** 🎉

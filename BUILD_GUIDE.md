# 🚀 Guia de Build - Sistema Financeiro

Este guia mostra como fazer o build do sistema de forma simples e rápida.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Docker (opcional, para containerização)

## 🏗️ Build Local Simples

### Opção 1: Script Automatizado (Recomendado)

**Windows:**
```bash
build.bat
```

**Linux/Mac:**
```bash
chmod +x build.sh
./build.sh
```

### Opção 2: Comandos Manuais

```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
npm run db:push

# 3. Fazer build
npm run build

# 4. Iniciar aplicação
npm start
```

## 🐳 Build com Docker

### Build e execução em uma linha:
```bash
npm run docker:build && npm run docker:up
```

### Comandos separados:
```bash
# Build da imagem (otimizado)
docker-compose build --no-cache

# Executar containers
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### Desenvolvimento com Docker:
```bash
# Apenas banco de dados (app roda local)
npm run docker:dev

# Com Redis (opcional)
docker-compose -f docker-compose.dev.yml --profile with-redis up -d
```

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run build` | Build de produção flexível |
| `npm run build:fast` | Build rápido (ignora erros menores) |
| `npm run build:production` | Build otimizado para produção |
| `npm run build:full` | Build completo com migração |
| `npm run start` | Iniciar em produção |
| `npm run dev` | Modo desenvolvimento |
| `npm run docker:build` | Build Docker otimizado |
| `npm run docker:up` | Executar containers de produção |
| `npm run docker:dev` | Executar apenas banco (desenvolvimento) |

## 📁 Estrutura após Build

```
.next/
├── static/          # Assets estáticos
├── standalone/      # Aplicação standalone
└── server.js        # Servidor de produção
```

## 🌐 Acessar a Aplicação

Após o build e inicialização:
- **Local:** http://localhost:3000
- **Docker:** http://localhost:3000

## ⚡ Otimizações Aplicadas

- ✅ Build standalone para menor tamanho
- ✅ Compressão habilitada
- ✅ Minificação SWC
- ✅ Otimização de imagens
- ✅ Multi-stage Docker build
- ✅ Cache de dependências

## 🔍 Verificação de Saúde

```bash
# Verificar se a aplicação está funcionando
curl http://localhost:3000/api/health
```

## 🐛 Resolução de Problemas

### Erro de Build
```bash
# Limpar cache e reinstalar
rm -rf node_modules .next
npm install
npm run build
```

### Erro de Banco
```bash
# Resetar banco de dados
npm run db:push
```

### Erro Docker
```bash
# Rebuild completo
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Notas Importantes

- O sistema usa SQLite por padrão (leve e simples)
- Para PostgreSQL, ajustar DATABASE_URL no .env
- Build otimizado para produção leve
- Telemetria do Next.js desabilitada

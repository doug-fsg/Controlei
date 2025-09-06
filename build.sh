#!/bin/bash

# Script de build simplificado para o Sistema Financeiro
# Este script automatiza todo o processo de build

echo "🚀 Iniciando build do Sistema Financeiro..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🗄️ Configurando banco de dados..."
npm run db:push

echo "🏗️ Gerando cliente Prisma..."
npx prisma generate

echo "🔨 Fazendo build da aplicação..."
npm run build

echo "✅ Build concluído com sucesso!"
echo ""
echo "🚀 Opções de execução:"
echo ""
echo "Local:"
echo "  npm start                    # Iniciar aplicação"
echo ""
echo "Docker (Produção):"
echo "  npm run docker:build         # Build da imagem"
echo "  npm run docker:up            # Executar containers"
echo ""
echo "Docker (Desenvolvimento):"
echo "  npm run docker:dev           # Apenas banco de dados"
echo ""
echo "Build rápido:"
echo "  npm run build:fast          # Build ignorando erros menores"

# Sistema Financeiro - MicroSaaS

Sistema web de controle financeiro para entradas e saídas, desenvolvido para pequenos empreendedores que precisam de um controle financeiro simples e eficiente.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Dashboard**: Visão geral com KPIs, resumos financeiros e gráficos
- **Gestão de Clientes**: CRUD completo com busca e filtros
- **Gestão de Fornecedores**: CRUD completo com busca e filtros
- **Vendas (Entradas)**: Sistema flexível de pagamentos
  - Entradas avulsas com valores e datas personalizadas
  - Parcelamento automático do saldo restante
  - Controle de status e progresso de pagamentos
- **Despesas (Saídas)**: Controle de despesas com parcelamento
- **Fluxo de Caixa**: Visualização cronológica de todas as movimentações
- **Relatórios de Inadimplência**: Análise de pagamentos em atraso

### 🔄 Sistema de Pagamentos Flexível
O diferencial do sistema é permitir que as vendas tenham pagamentos totalmente flexíveis:

**Exemplo prático:**
- Venda de R$ 2.000,00 para João Silva
- Entrada 1: R$ 100,00 (10/09/2025)
- Entrada 2: R$ 200,00 (20/09/2025)
- Saldo restante: R$ 1.700,00 parcelado em 5x de R$ 340,00 a partir de 01/10/2025

O sistema gera automaticamente:
- Entrada R$ 100,00 (10/09/2025) ✅
- Entrada R$ 200,00 (20/09/2025) ✅
- Parcela 1/5 R$ 340,00 (01/10/2025) ⏳
- Parcela 2/5 R$ 340,00 (01/11/2025) ⏳
- Parcela 3/5 R$ 340,00 (01/12/2025) ⏳
- Parcela 4/5 R$ 340,00 (01/01/2026) ⏳
- Parcela 5/5 R$ 340,00 (01/02/2026) ⏳

## 🛠 Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes baseados em Radix UI
- **Lucide React** - Ícones
- **Mock Data** - Dados de demonstração (preparado para BD real)

## 🏃‍♂️ Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone [url-do-repositorio]

# Entre na pasta do projeto
cd sistema-financeiro

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

### Outros Comandos
```bash
npm run build    # Build de produção
npm run start    # Executar build de produção
npm run lint     # Verificar código
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── clients/           # Gestão de clientes
│   ├── suppliers/         # Gestão de fornecedores
│   ├── sales/             # Módulo de vendas
│   ├── expenses/          # Módulo de despesas
│   ├── cashflow/          # Fluxo de caixa
│   └── reports/           # Relatórios
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── layout/            # Layout e navegação
│   ├── clients/           # Componentes de clientes
│   ├── suppliers/         # Componentes de fornecedores
│   ├── sales/             # Componentes de vendas
│   └── expenses/          # Componentes de despesas
├── types/
│   └── index.ts           # Tipos TypeScript
└── lib/
    └── utils.ts           # Utilitários
```

## 🎨 Design System

### Cores Semânticas
- 🟢 **Verde**: Entradas, receitas, valores positivos
- 🔴 **Vermelho**: Saídas, despesas, valores negativos  
- 🔵 **Azul**: Informações neutras, saldos
- 🟡 **Amarelo/Laranja**: Alertas, atenção, atrasos

### Componentes
- Cards para agrupamento de informações
- Tabelas responsivas para listagens
- Formulários modais para criação/edição
- Badges para status e categorias
- Barras de progresso para pagamentos

## 📊 Dados e Cálculos

### Métricas Calculadas
- **Total de Entradas**: Soma de todas as vendas
- **Total de Saídas**: Soma de todas as despesas
- **Saldo Líquido**: Entradas - Saídas
- **Progresso de Pagamentos**: (Valor pago / Valor total) × 100
- **Dias de Atraso**: Data atual - Data de vencimento
- **Saldo Acumulado**: Cálculo sequencial no fluxo de caixa

### Formatação
- **Moeda**: R$ 1.234,56 (padrão brasileiro)
- **Data**: DD/MM/AAAA
- **Percentual**: 85% (arredondado)

## 🔮 Próximas Implementações

- [ ] Sistema de autenticação (login/senha)
- [ ] Banco de dados real (PostgreSQL/MySQL)
- [ ] API Routes para operações CRUD
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Notificações de vencimento
- [ ] Dashboard com gráficos interativos
- [ ] Backup e sincronização em nuvem
- [ ] Categorização de receitas e despesas
- [ ] Metas financeiras
- [ ] Controle de estoque básico

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para simplificar o controle financeiro de pequenos negócios**
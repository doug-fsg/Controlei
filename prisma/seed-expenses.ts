import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Função para converter valor brasileiro para decimal
function parseBrazilianCurrency(value: string): number {
  return parseFloat(value.replace('R$', '').replace('.', '').replace(',', '.').trim())
}

// Função para converter data brasileira para Date
function parseBrazilianDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

async function main() {
  console.log('🌱 Iniciando seed de despesas...')

  // Buscar usuário e organização existentes
  const user = await prisma.user.findUnique({
    where: { email: 'dev@sistema.com' }
  })

  if (!user) {
    console.log('❌ Usuário não encontrado. Execute primeiro o seed principal.')
    return
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: 'empresa-principal' }
  })

  if (!organization) {
    console.log('❌ Organização não encontrada. Execute primeiro o seed principal.')
    return
  }

  console.log('👤 Usuário encontrado:', user.email)
  console.log('🏢 Organização encontrada:', organization.name)

  // Buscar ou criar categorias de despesas
  const categoryNames = [
    'Projetos',
    'Veículos', 
    'Gastos variáveis',
    'Fornecedores',
    'Colaboradores'
  ]

  const categories = []
  for (const name of categoryNames) {
    const category = await prisma.expenseCategory.upsert({
      where: { 
        name_userId: {
          name: name,
          userId: user.id
        }
      },
      update: {},
      create: {
        name: name,
        description: `Categoria ${name}`,
        userId: user.id,
        organizationId: organization.id,
      },
    })
    categories.push(category)
  }

  console.log('📂 Categorias de despesas criadas:', categories.length)

  // Dados das despesas
  const expensesData = [
    { date: '12/06/2025', category: 'Projetos', description: 'projeto luis ozorio', amount: 'R$ 600,00', status: 'Pago' },
    { date: '01/06/2025', category: 'Veículos', description: 'abastecimento ka', amount: 'R$ 200,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'internet fronteira duotec', amount: 'R$ 99,99', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'internet fronteira duotec iluminação', amount: 'R$ 99,99', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'PEDAGIO', amount: 'R$ 5,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'PEDAGIO', amount: 'R$ 5,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'PEDAGIO', amount: 'R$ 5,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'PEDAGIO', amount: 'R$ 5,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Veículos', description: 'DIESEL VAN', amount: 'R$ 187,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'DIESEL VAN', amount: 'R$ 29,00', status: 'Pago' },
    { date: '11/06/2025', category: 'Veículos', description: 'DIESEL VAN', amount: 'R$ 209,07', status: 'Pago' },
    { date: '12/06/2025', category: 'Veículos', description: 'DIESEL VAN', amount: 'R$ 135,62', status: 'Pago' },
    { date: '12/06/2025', category: 'Gastos variáveis', description: 'JANTA', amount: 'R$ 135,62', status: 'Pago' },
    { date: '12/06/2025', category: 'Gastos variáveis', description: 'JANTA', amount: 'R$ 135,62', status: 'Pago' },
    { date: '10/06/2025', category: 'Veículos', description: 'COMBUSTIVEL VAN', amount: 'R$ 132,90', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'VEDACITE CALHAS', amount: 'R$ 50,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'VIAGEM RODRIGO', amount: 'R$ 32,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Gastos variáveis', description: 'ABASTECIMENTO KA', amount: 'R$ 100,00', status: 'Pago' },
    { date: '10/06/2025', category: 'Veículos', description: 'ABASTECIMENTO KA', amount: 'R$ 100,00', status: 'Pago' },
    { date: '05/06/2025', category: 'Gastos variáveis', description: 'VEDACITE', amount: 'R$ 38,21', status: 'Pago' },
    { date: '05/06/2025', category: 'Gastos variáveis', description: 'BROCA', amount: 'R$ 15,30', status: 'Pago' },
    { date: '05/06/2025', category: 'Fornecedores', description: 'GAUCHA MATERIAIS', amount: 'R$ 691,70', status: 'Pago' },
    { date: '05/06/2025', category: 'Veículos', description: 'ABASTECIMENTO VAN', amount: 'R$ 254,26', status: 'Pago' },
    { date: '05/06/2025', category: 'Veículos', description: 'ABASTECIMENTO VAN', amount: 'R$ 174,82', status: 'Pago' },
    { date: '04/06/2025', category: 'Veículos', description: 'ABASTECIMENTO VAN', amount: 'R$ 352,27', status: 'Pago' },
    { date: '04/06/2025', category: 'Veículos', description: 'ABASTECIMENTO VAN', amount: 'R$ 100,00', status: 'Pago' },
    { date: '04/06/2025', category: 'Fornecedores', description: 'BASE EQUIPAMENTOS', amount: 'R$ 100,00', status: 'Pago' },
    { date: '06/06/2025', category: 'Colaboradores', description: 'RODRIGO NUNES VIEIRA', amount: 'R$ 420,00', status: 'Pago' },
    { date: '05/06/2025', category: 'Gastos variáveis', description: 'VIAGEM RODRIGO BARRETO', amount: 'R$ 35,00', status: 'Pago' },
    { date: '25/06/2025', category: 'Projetos', description: 'ERNESTINA', amount: 'R$ 600,00', status: 'Pago' },
    { date: '25/06/2025', category: 'Projetos', description: 'EVANDRO SENA', amount: 'R$ 600,00', status: 'Pago' },
    { date: '25/06/2025', category: 'Projetos', description: 'SIMONE RICARDO', amount: 'R$ 600,00', status: 'Pago' },
    { date: '25/06/2025', category: 'Projetos', description: 'JONATHA ART', amount: 'R$ 600,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Veículos', description: 'CARLOS MECANICO', amount: 'R$ 560,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Colaboradores', description: 'ADILSON MARTINS', amount: 'R$ 450,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'WG MILENIUM', amount: 'R$ 496,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Gastos variáveis', description: 'ADRIANO AGUIAR', amount: 'R$ 290,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Colaboradores', description: 'MARCELO AQUINO', amount: 'R$ 1.400,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'BOX DISTRIBUIDORA', amount: 'R$ 1.261,52', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'BOX DISTRIBUIDORA', amount: 'R$ 23.016,84', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'BOX DISTRIBUIDORA', amount: 'R$ 8.296,61', status: 'Pago' },
    { date: '16/06/2025', category: 'Colaboradores', description: 'RODRIGO (PORTUGAL)', amount: 'R$ 1.625,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Gastos variáveis', description: 'REVISTA ACONTECE', amount: 'R$ 389,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Veículos', description: 'RASTREK', amount: 'R$ 389,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Colaboradores', description: 'EXAMES', amount: 'R$ 150,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Colaboradores', description: 'PABLO DIEZ', amount: 'R$ 1.540,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Colaboradores', description: 'PABLO DIEZ', amount: 'R$ 1.540,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Projetos', description: 'PROJETO', amount: 'R$ 600,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Veículos', description: 'JULIANO BATISTA (KA)', amount: 'R$ 650,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Projetos', description: 'PROJETO', amount: 'R$ 600,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Projetos', description: 'PROJETO', amount: 'R$ 600,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Projetos', description: 'PROJETO ART', amount: 'R$ 600,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'PROJETO ART', amount: 'R$ 1.629,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'FERRAGEM COMERCIALGAUCHA', amount: 'R$ 691,70', status: 'Pago' },
    { date: '16/06/2025', category: 'Gastos variáveis', description: 'DINTEC', amount: 'R$ 435,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Gastos variáveis', description: 'BRK', amount: 'R$ 628,91', status: 'Pago' },
    { date: '16/06/2025', category: 'Gastos variáveis', description: 'PROJETO', amount: 'R$ 600,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Gastos variáveis', description: 'PROJETO', amount: 'R$ 766,23', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 520,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Gastos variáveis', description: 'DEFENSUL', amount: 'R$ 520,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Projetos', description: 'PROJETOS', amount: 'R$ 160,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Colaboradores', description: 'EVERTON SEVERO', amount: 'R$ 2.000,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Veículos', description: 'POLO FINANCIAMENTO', amount: 'R$ 1.148,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 126,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 186,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 103,00', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 141,50', status: 'Pago' },
    { date: '16/06/2025', category: 'Fornecedores', description: 'CONDUSVALE PARCELA 01', amount: 'R$ 769,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Fornecedores', description: 'box distribuidora', amount: 'R$ 842,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Fornecedores', description: 'WG', amount: 'R$ 3.092,87', status: 'Pago' },
    { date: '30/06/2025', category: 'Colaboradores', description: 'WG', amount: 'R$ 600,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Gastos variáveis', description: 'PEDREIRO', amount: 'R$ 500,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Gastos variáveis', description: 'FRUTEIRA', amount: 'R$ 4.750,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Fornecedores', description: 'WG', amount: 'R$ 11.000,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Projetos', description: 'ABASTECIMENTO KA', amount: 'R$ 337,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Colaboradores', description: 'EVERTON SEVERO COMISÃO', amount: 'R$ 1.400,00', status: 'Pago' },
    { date: '20/06/2025', category: 'Fornecedores', description: 'WG MILENIUM', amount: 'R$ 24.235,00', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'SIMPLES NACIONAL', amount: 'R$ 415,15', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'SIMPLES NACIONAL PARCELA 07/60', amount: 'R$ 415,15', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'SIMPLES NACIONAL PARCELA 06/60', amount: 'R$ 460,15', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'SIMPLES NACIONAL PARCELA 05/60', amount: 'R$ 460,15', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'SIMPLES NACIONAL PARCELA 04/60', amount: 'R$ 460,15', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'SIMPLES NACIONAL PARCELA 03/60', amount: 'R$ 460,15', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'SIMPLES NACIONAL PARCELA 02/60', amount: 'R$ 460,15', status: 'Pago' },
    { date: '20/06/2025', category: 'Projetos', description: 'ABASTECIMENTO', amount: 'R$ 218,63', status: 'Pago' },
    { date: '20/06/2025', category: 'Projetos', description: 'ABASTECIMENTO', amount: 'R$ 30,00', status: 'Pago' },
    { date: '20/06/2025', category: 'Projetos', description: 'ABASTECIMENTO VAN', amount: 'R$ 169,00', status: 'Pago' },
    { date: '20/06/2025', category: 'Gastos variáveis', description: 'ABASTECIMENTO VAN', amount: 'R$ 52,00', status: 'Pago' },
    { date: '05/06/2025', category: 'Gastos variáveis', description: 'ALUGUEL', amount: 'R$ 3.000,00', status: 'Pago' },
    { date: '07/07/2025', category: 'Gastos variáveis', description: '', amount: 'R$ 3.000,00', status: 'Pago' },
    { date: '06/06/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 2.000,00', status: 'Pago' },
    { date: '06/06/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 1.560,00', status: 'Pago' },
    { date: '06/06/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 1.400,00', status: 'Pago' },
    { date: '06/06/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 3.000,00', status: 'Pago' },
    { date: '06/06/2025', category: 'Colaboradores', description: 'MIDIA', amount: 'R$ 3.000,00', status: 'Pago' },
    { date: '06/06/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 2.200,00', status: 'Pago' },
    { date: '24/07/2025', category: 'Projetos', description: 'PROJETO', amount: 'R$ 500,00', status: 'Pago' },
    { date: '28/07/2025', category: 'Fornecedores', description: 'PROJETO', amount: 'R$ 10.000,00', status: 'Pago' },
    { date: '10/07/2025', category: 'Fornecedores', description: 'PROJETO', amount: 'R$ 10.000,00', status: 'Pago' },
    { date: '10/07/2025', category: 'Fornecedores', description: 'PROJETO', amount: 'R$ 7.353,87', status: 'Pago' },
    { date: '10/07/2025', category: 'Gastos variáveis', description: 'FRUTEIRA', amount: 'R$ 2.750,00', status: 'Pago' },
    { date: '29/07/2025', category: 'Gastos variáveis', description: 'VIVO', amount: 'R$ 59,00', status: 'Pago' },
    { date: '29/07/2025', category: 'Fornecedores', description: 'BOX', amount: 'R$ 1.591,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 1.600,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 2.000,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Projetos', description: '', amount: 'R$ 600,00', status: 'Pago' },
    { date: '17/07/2025', category: 'Projetos', description: '', amount: 'R$ 500,00', status: 'Pago' },
    { date: '17/07/2025', category: 'Projetos', description: '', amount: 'R$ 500,00', status: 'Pago' },
    { date: '05/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 176,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Gastos variáveis', description: '', amount: 'R$ 265,00', status: 'Pago' },
    { date: '30/07/2025', category: 'Fornecedores', description: 'BRASILUX', amount: 'R$ 570,00', status: 'Pago' },
    { date: '31/07/2025', category: 'Fornecedores', description: 'BOX', amount: 'R$ 900,00', status: 'Pago' },
    { date: '31/07/2025', category: 'Gastos variáveis', description: 'DEFENSUL', amount: 'R$ 316,11', status: 'Pago' },
    { date: '26/07/2025', category: 'Colaboradores', description: '', amount: 'R$ 550,00', status: 'Pago' },
    { date: '25/07/2025', category: 'Colaboradores', description: 'VALE', amount: 'R$ 200,00', status: 'Pago' },
    { date: '24/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 1.631,76', status: 'Pago' },
    { date: '23/07/2025', category: 'Fornecedores', description: 'SOLIDUZ', amount: 'R$ 769,00', status: 'Pago' },
    { date: '22/07/2025', category: 'Gastos variáveis', description: 'DINTEC', amount: 'R$ 435,40', status: 'Pago' },
    { date: '17/07/2025', category: 'Colaboradores', description: '', amount: 'R$ 280,00', status: 'Pago' },
    { date: '21/07/2025', category: 'Gastos variáveis', description: 'CURSO FERNANDA', amount: 'R$ 280,00', status: 'Pago' },
    { date: '21/07/2025', category: 'Gastos variáveis', description: 'EVERALDO ARCONDICIONADO', amount: 'R$ 400,00', status: 'Pago' },
    { date: '14/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 400,00', status: 'Pago' },
    { date: '14/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 226,00', status: 'Pago' },
    { date: '14/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 1.196,54', status: 'Pago' },
    { date: '12/07/2025', category: 'Fornecedores', description: 'NICOLY', amount: 'R$ 300,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: 'NICOLY', amount: 'R$ 750,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Gastos variáveis', description: 'SALARIO', amount: 'R$ 750,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Gastos variáveis', description: 'PLACAS DE ADVERTENCIA', amount: 'R$ 102,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Veículos', description: 'ABASTECIMENTO KA', amount: 'R$ 251,54', status: 'Pago' },
    { date: '11/07/2025', category: 'Projetos', description: 'PROJETO', amount: 'R$ 2.000,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Gastos variáveis', description: 'MATERIAL 15 NOV', amount: 'R$ 500,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: 'BOMBA ELETRICA INSTALAÇÃO', amount: 'R$ 445,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Veículos', description: 'RASTREADOR', amount: 'R$ 59,90', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 2.567,77', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: 'DINTEC', amount: 'R$ 540,10', status: 'Pago' },
    { date: '11/07/2025', category: 'Colaboradores', description: '', amount: 'R$ 1.400,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Colaboradores', description: 'SALARIO', amount: 'R$ 750,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: 'RENEGOCIAÇÃO', amount: 'R$ 749,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: 'RENEGOCIAÇÃO', amount: 'R$ 749,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 108,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Veículos', description: 'ABASTECIMENTO VAN', amount: 'R$ 169,00', status: 'Pago' },
    { date: '30/06/2025', category: 'Fornecedores', description: '', amount: 'R$ 842,00', status: 'Pago' },
    { date: '01/07/2025', category: 'Gastos variáveis', description: 'agua', amount: 'R$ 864,00', status: 'Pago' },
    { date: '10/07/2025', category: 'Fornecedores', description: 'art graf', amount: 'R$ 160,00', status: 'Pago' },
    { date: '03/07/2025', category: 'Fornecedores', description: 'condusvale', amount: 'R$ 769,00', status: 'Pago' },
    { date: '03/06/2025', category: 'Fornecedores', description: 'rge', amount: 'R$ 581,75', status: 'Pago' },
    { date: '05/07/2025', category: 'Veículos', description: 'ka', amount: 'R$ 134,83', status: 'Pago' },
    { date: '09/07/2025', category: 'Veículos', description: 'ka', amount: 'R$ 144,53', status: 'Pago' },
    { date: '10/07/2025', category: 'Fornecedores', description: 'internet', amount: 'R$ 99,90', status: 'Pago' },
    { date: '10/07/2025', category: 'Fornecedores', description: 'internet quadra', amount: 'R$ 99,90', status: 'Pago' },
    { date: '14/07/2025', category: 'Fornecedores', description: 'wg', amount: 'R$ 10.999,00', status: 'Pago' },
    { date: '14/07/2025', category: 'Fornecedores', description: 'rge', amount: 'R$ 545,39', status: 'Pago' },
    { date: '10/07/2025', category: 'Veículos', description: 'rodrigo', amount: 'R$ 23,00', status: 'Pago' },
    { date: '26/06/2025', category: 'Fornecedores', description: 'vivo', amount: 'R$ 75,00', status: 'Pago' },
    { date: '26/06/2025', category: 'Fornecedores', description: 'vivo', amount: 'R$ 26,00', status: 'Pago' },
    { date: '26/06/2025', category: 'Fornecedores', description: 'vivo', amount: 'R$ 76,68', status: 'Pago' },
    { date: '26/06/2025', category: 'Fornecedores', description: 'vivo', amount: 'R$ 130,00', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: 'vivo', amount: 'R$ 9.414,39', status: 'Pago' },
    { date: '23/07/2025', category: 'Veículos', description: 'abastec van', amount: 'R$ 100,00', status: 'Pago' },
    { date: '23/07/2025', category: 'Gastos variáveis', description: 'abastec van', amount: 'R$ 42,50', status: 'Pago' },
    { date: '23/07/2025', category: 'Gastos variáveis', description: 'abastec van', amount: 'R$ 42,50', status: 'Pago' },
    { date: '24/07/2025', category: 'Fornecedores', description: '', amount: 'R$ 359,68', status: 'Pago' },
    { date: '11/07/2025', category: 'Fornecedores', description: 'WG', amount: 'R$ 2.567,77', status: 'Pago' },
    { date: '21/07/2025', category: 'Fornecedores', description: 'VIAGEM RODRIGO', amount: 'R$ 600,00', status: 'Pago' },
    { date: '21/07/2025', category: 'Gastos variáveis', description: 'VIAGEM RODRIGO', amount: 'R$ 600,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Colaboradores', description: '', amount: 'R$ 2.500,00', status: 'Pago' },
    { date: '15/07/2025', category: 'Colaboradores', description: 'RADICACION', amount: 'R$ 5.000,00', status: 'Pago' },
    { date: '03/07/2025', category: 'Fornecedores', description: 'CONDUSVALE', amount: 'R$ 769,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Fornecedores', description: 'viagem WG', amount: 'R$ 400,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Fornecedores', description: 'viagem WG', amount: 'R$ 900,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Veículos', description: 'DIESEL VAN', amount: 'R$ 300,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Veículos', description: 'CORTELINE', amount: 'R$ 108,00', status: 'Pago' },
    { date: '08/07/2025', category: 'Veículos', description: 'VAN', amount: 'R$ 400,00', status: 'Pago' },
    { date: '04/07/2025', category: 'Gastos variáveis', description: 'DEFENSUL', amount: 'R$ 176,00', status: 'Pago' },
    { date: '04/07/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 235,00', status: 'Pago' },
    { date: '04/07/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 86,75', status: 'Pago' },
    { date: '04/07/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 108,75', status: 'Pago' },
    { date: '04/07/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 140,00', status: 'Pago' },
    { date: '04/07/2025', category: 'Fornecedores', description: 'MERCOSUL', amount: 'R$ 400,00', status: 'Pago' }
  ]

  console.log('📊 Criando despesas...')

  // Criar despesas
  for (const expenseData of expensesData) {
    const category = categories.find(c => c.name === expenseData.category)
    if (!category) {
      console.log(`⚠️ Categoria não encontrada: ${expenseData.category}`)
      continue
    }

    await prisma.expense.create({
      data: {
        amount: parseBrazilianCurrency(expenseData.amount),
        description: expenseData.description || 'Sem descrição',
        dueDate: parseBrazilianDate(expenseData.date),
        categoryId: category.id,
        userId: user.id,
        organizationId: organization.id,
        status: expenseData.status === 'Pago' ? 'PAID' : 'PENDING',
      },
    })
  }

  console.log('✅ Despesas criadas:', expensesData.length)
  console.log('✅ Seed de despesas concluído!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

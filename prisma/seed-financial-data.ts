import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Função para converter data brasileira para Date
function parseBrazilianDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

// Função para converter valor brasileiro para número
function parseBrazilianCurrency(valueStr: string): number {
  return parseFloat(valueStr.replace('R$ ', '').replace('.', '').replace(',', '.'))
}

async function main() {
  console.log('🌱 Iniciando seed com dados financeiros...')

  // Criar usuário temporário
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'dev@sistema.com' },
    update: {},
    create: {
      email: 'dev@sistema.com',
      name: 'Usuário de Desenvolvimento',
      password: hashedPassword,
    },
  })

  console.log('👤 Usuário criado:', user.email)

  // Criar organização
  const organization = await prisma.organization.upsert({
    where: { slug: 'empresa-principal' },
    update: {},
    create: {
      name: 'Empresa Principal',
      slug: 'empresa-principal',
    },
  })

  console.log('🏢 Organização criada:', organization.name)

  // Associar usuário à organização
  await prisma.userOrganization.upsert({
    where: { 
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      }
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: 'owner',
      isActive: true,
    },
  })

  console.log('🔗 Usuário associado à organização')

  // Dados dos pagamentos organizados por cliente
  const paymentData = [
    // CLEINE DE FREITAS ARAUJO TAVARES - 11 parcelas de R$ 1.000,00
    {
      clientName: 'CLEINE DE FREITAS ARAUJO TAVARES',
      saleDate: '26/06/2025',
      totalAmount: 11000,
      payments: [
        { installment: 1, total: 11, amount: 1000, dueDate: '15/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 11, amount: 1000, dueDate: '15/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 11, amount: 1000, dueDate: '15/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 11, amount: 1000, dueDate: '15/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 11, amount: 1000, dueDate: '15/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 11, amount: 1000, dueDate: '15/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 11, amount: 1000, dueDate: '15/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 11, amount: 1000, dueDate: '15/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 11, amount: 1000, dueDate: '15/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 11, amount: 1000, dueDate: '15/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 11, amount: 1000, dueDate: '15/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // APAE URUGUAIANA - Entrada única de R$ 19.750,00
    {
      clientName: 'APAE URUGUAIANA',
      saleDate: '26/06/2025',
      totalAmount: 19750,
      payments: [
        { installment: null, total: null, amount: 19750, dueDate: '26/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '26/06/2025' },
      ]
    },
    // ALAMIR MOURA - Entrada + 15 parcelas de R$ 622,22
    {
      clientName: 'ALAMIR MOURA',
      saleDate: '26/06/2025',
      totalAmount: 9333.30,
      payments: [
        { installment: null, total: null, amount: 622.22, dueDate: '26/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '26/06/2025' },
        { installment: 1, total: 15, amount: 622.22, dueDate: '10/07/2025', status: 'PAID', type: 'INSTALLMENT', paidDate: '26/06/2025' },
        { installment: 2, total: 15, amount: 622.22, dueDate: '10/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 15, amount: 622.22, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 15, amount: 622.22, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 15, amount: 622.22, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 15, amount: 622.22, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 15, amount: 622.22, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 15, amount: 622.22, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 15, amount: 622.22, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 15, amount: 622.22, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 15, amount: 622.22, dueDate: '10/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 15, amount: 622.22, dueDate: '10/06/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 15, amount: 622.22, dueDate: '10/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 15, amount: 622.22, dueDate: '10/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 15, total: 15, amount: 622.22, dueDate: '10/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // PAMPA GARDEN - 10 parcelas de R$ 2.300,00
    {
      clientName: 'PAMPA GARDEN',
      saleDate: '09/06/2025',
      totalAmount: 23000,
      payments: [
        { installment: 1, total: 10, amount: 2300, dueDate: '10/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 2300, dueDate: '10/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 2300, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 2300, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 2300, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 2300, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 2300, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 2300, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 2300, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 2300, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // DAIANEBARBO COSTA - Parcela única de R$ 5.500,00
    {
      clientName: 'DAIANEBARBO COSTA',
      saleDate: '15/06/2025',
      totalAmount: 5500,
      payments: [
        { installment: 1, total: 1, amount: 5500, dueDate: '15/06/2025', status: 'PAID', type: 'INSTALLMENT', paidDate: '15/06/2025' },
      ]
    },
    // CRISTINA JARDIM RIBEIRO - Parcela única de R$ 1.180,00
    {
      clientName: 'CRISTINA JARDIM RIBEIRO',
      saleDate: '15/06/2025',
      totalAmount: 1180,
      payments: [
        { installment: 1, total: 1, amount: 1180, dueDate: '15/06/2025', status: 'PAID', type: 'INSTALLMENT', paidDate: '15/06/2025' },
      ]
    },
    // CLOVES BORGES GOMES - Parcela única de R$ 392,00
    {
      clientName: 'CLOVES BORGES GOMES',
      saleDate: '15/06/2025',
      totalAmount: 392,
      payments: [
        { installment: 1, total: 1, amount: 392, dueDate: '15/06/2025', status: 'PAID', type: 'INSTALLMENT', paidDate: '15/06/2025' },
      ]
    },
    // CARLOS ALBERT0 VIVIANE MARQUES - Parcela única de R$ 870,00
    {
      clientName: 'CARLOS ALBERT0 VIVIANE MARQUES',
      saleDate: '15/06/2025',
      totalAmount: 870,
      payments: [
        { installment: 1, total: 1, amount: 870, dueDate: '15/06/2025', status: 'PAID', type: 'INSTALLMENT', paidDate: '15/06/2025' },
      ]
    },
    // ANDREIA BENITES MELO - Parcela única de R$ 416,00
    {
      clientName: 'ANDREIA BENITES MELO',
      saleDate: '15/06/2025',
      totalAmount: 416,
      payments: [
        { installment: 1, total: 1, amount: 416, dueDate: '15/06/2025', status: 'PAID', type: 'INSTALLMENT', paidDate: '15/06/2025' },
      ]
    },
    // ANDERSON LUIS CRISTIANE - Parcela única de R$ 343,00
    {
      clientName: 'ANDERSON LUIS CRISTIANE',
      saleDate: '15/06/2025',
      totalAmount: 343,
      payments: [
        { installment: 1, total: 1, amount: 343, dueDate: '15/06/2025', status: 'PAID', type: 'INSTALLMENT', paidDate: '15/06/2025' },
      ]
    },
    // DELFINO PRESTES DA SILVA - Entrada de R$ 500,00
    {
      clientName: 'DELFINO PRESTES DA SILVA',
      saleDate: '15/06/2025',
      totalAmount: 500,
      payments: [
        { installment: null, total: null, amount: 500, dueDate: '15/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '15/06/2025' },
      ]
    },
    // DOUGLAS PEREIRA - Entrada de R$ 760,00
    {
      clientName: 'DOUGLAS PEREIRA',
      saleDate: '15/06/2025',
      totalAmount: 760,
      payments: [
        { installment: null, total: null, amount: 760, dueDate: '15/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '15/06/2025' },
      ]
    },
    // EDER FERNANDO BICCA - Parcela única de R$ 13.500,00
    {
      clientName: 'EDER FERNANDO BICCA',
      saleDate: '15/06/2025',
      totalAmount: 13500,
      payments: [
        { installment: 1, total: 1, amount: 13500, dueDate: '15/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // EDSON GILMAR - Entrada de R$ 1.033,00
    {
      clientName: 'EDSON GILMAR',
      saleDate: '16/06/2025',
      totalAmount: 1033,
      payments: [
        { installment: null, total: null, amount: 1033, dueDate: '16/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '16/06/2025' },
      ]
    },
    // FABIANO DE MOURA - Entrada + 8 parcelas de R$ 758,00
    {
      clientName: 'FABIANO DE MOURA',
      saleDate: '15/06/2025',
      totalAmount: 6822,
      payments: [
        { installment: null, total: null, amount: 758, dueDate: '15/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '15/06/2025' },
        { installment: 1, total: 8, amount: 758, dueDate: '16/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 8, amount: 758, dueDate: '16/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 8, amount: 758, dueDate: '16/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 8, amount: 758, dueDate: '16/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 8, amount: 758, dueDate: '16/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 8, amount: 758, dueDate: '16/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 8, amount: 758, dueDate: '16/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 8, amount: 758, dueDate: '16/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // ELIAS DA SILVA JUNIOR - Entrada + 14 parcelas de R$ 250,00 (1 atrasada)
    {
      clientName: 'ELIAS DA SILVA JUNIOR',
      saleDate: '15/05/2025',
      totalAmount: 3750,
      payments: [
        { installment: null, total: null, amount: 250, dueDate: '15/05/2025', status: 'PAID', type: 'ADVANCE', paidDate: '15/05/2025' },
        { installment: 1, total: 14, amount: 250, dueDate: '15/06/2025', status: 'OVERDUE', type: 'INSTALLMENT' },
        { installment: 2, total: 14, amount: 250, dueDate: '15/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 14, amount: 250, dueDate: '15/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 14, amount: 250, dueDate: '15/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 14, amount: 250, dueDate: '15/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 14, amount: 250, dueDate: '15/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 14, amount: 250, dueDate: '15/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 14, amount: 250, dueDate: '15/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 14, amount: 250, dueDate: '15/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 14, amount: 250, dueDate: '15/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 14, amount: 250, dueDate: '15/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 14, amount: 250, dueDate: '15/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 14, amount: 250, dueDate: '15/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 14, amount: 250, dueDate: '15/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // DAIANE BARBO COSTA - Entrada + 10 parcelas de R$ 600,00 + parcela final
    {
      clientName: 'DAIANE BARBO COSTA',
      saleDate: '16/06/2025',
      totalAmount: 11600,
      payments: [
        { installment: null, total: null, amount: 5600, dueDate: '16/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '16/06/2025' },
        { installment: 1, total: 10, amount: 600, dueDate: '17/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 600, dueDate: '17/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 600, dueDate: '17/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 600, dueDate: '17/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 600, dueDate: '17/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 600, dueDate: '17/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 600, dueDate: '17/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 600, dueDate: '17/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 600, dueDate: '17/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 600, dueDate: '17/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 1, total: 1, amount: 2900, dueDate: '17/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // MARLEIZA BISSACO DA SILVEIRA - 3 parcelas de R$ 2.333,33
    {
      clientName: 'MARLEIZA BISSACO DA SILVEIRA',
      saleDate: '16/06/2025',
      totalAmount: 7000,
      payments: [
        { installment: 1, total: 3, amount: 2333.33, dueDate: '26/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 3, amount: 2333.33, dueDate: '26/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 3, amount: 2333.33, dueDate: '26/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // MAYSA LUCIANE RIBEIRO - 3 parcelas de R$ 500,00
    {
      clientName: 'MAYSA LUCIANE RIBEIRO',
      saleDate: '16/06/2025',
      totalAmount: 1500,
      payments: [
        { installment: 1, total: 3, amount: 500, dueDate: '15/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 3, amount: 500, dueDate: '15/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 3, amount: 500, dueDate: '15/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // ELAINE DIAS PEREIRA DORNELES - Entrada + 12 parcelas de R$ 483,33 (completas)
    {
      clientName: 'ELAINE DIAS PEREIRA DORNELES',
      saleDate: '13/05/2025',
      totalAmount: 16800,
      payments: [
        { installment: null, total: null, amount: 11000, dueDate: '13/05/2025', status: 'PAID', type: 'ADVANCE', paidDate: '13/05/2025' },
        { installment: 1, total: 12, amount: 483.33, dueDate: '10/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 12, amount: 483.33, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 12, amount: 483.33, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 12, amount: 483.33, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 12, amount: 483.33, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 12, amount: 483.33, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 12, amount: 483.33, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 12, amount: 483.33, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 12, amount: 483.33, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 12, amount: 483.33, dueDate: '10/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 12, amount: 483.33, dueDate: '10/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 12, amount: 483.33, dueDate: '10/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // EDUARDO BULDAIN D ORNELLAS - Entrada + 12 parcelas de R$ 690,00
    {
      clientName: 'EDUARDO BULDAIN D ORNELLAS',
      saleDate: '13/05/2025',
      totalAmount: 13800,
      payments: [
        { installment: null, total: null, amount: 5520, dueDate: '13/05/2025', status: 'PAID', type: 'ADVANCE', paidDate: '13/05/2025' },
        { installment: 1, total: 12, amount: 690, dueDate: '19/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 12, amount: 690, dueDate: '19/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 12, amount: 690, dueDate: '19/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 12, amount: 690, dueDate: '19/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 12, amount: 690, dueDate: '19/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 12, amount: 690, dueDate: '19/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 12, amount: 690, dueDate: '19/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 12, amount: 690, dueDate: '19/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 12, amount: 690, dueDate: '19/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 12, amount: 690, dueDate: '19/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 12, amount: 690, dueDate: '19/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 12, amount: 690, dueDate: '19/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // MARCELO ROSAMAR NUNES DE ARAUJO - Entrada + 10 parcelas de R$ 800,00
    {
      clientName: 'MARCELO ROSAMAR NUNES DE ARAUJO',
      saleDate: '14/07/2025',
      totalAmount: 15000,
      payments: [
        { installment: null, total: null, amount: 7000, dueDate: '14/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '14/07/2025' },
        { installment: 1, total: 10, amount: 800, dueDate: '10/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 800, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 800, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 800, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 800, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 800, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 800, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 800, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 800, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 800, dueDate: '10/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // JOSE NEWTON DE FREITAS BETTEGA - Entrada + 14 parcelas de R$ 414,29
    {
      clientName: 'JOSE NEWTON DE FREITAS BETTEGA',
      saleDate: '24/06/2025',
      totalAmount: 19900,
      payments: [
        { installment: null, total: null, amount: 14100, dueDate: '24/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '24/06/2025' },
        { installment: 1, total: 14, amount: 414.29, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 14, amount: 414.29, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 14, amount: 414.29, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 14, amount: 414.29, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 14, amount: 414.29, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 14, amount: 414.29, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 14, amount: 414.29, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 14, amount: 414.29, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 14, amount: 414.29, dueDate: '10/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 14, amount: 414.29, dueDate: '10/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 14, amount: 414.29, dueDate: '10/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 14, amount: 414.29, dueDate: '10/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 14, amount: 414.29, dueDate: '10/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 14, amount: 414.29, dueDate: '10/10/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // ANA PAULA RIBEIRO LUNARDINI - Entrada + 14 parcelas de R$ 571,43
    {
      clientName: 'ANA PAULA RIBEIRO LUNARDINI',
      saleDate: '04/06/2025',
      totalAmount: 20000,
      payments: [
        { installment: null, total: null, amount: 12000, dueDate: '04/06/2025', status: 'PAID', type: 'ADVANCE', paidDate: '04/06/2025' },
        { installment: 1, total: 14, amount: 571.43, dueDate: '05/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 14, amount: 571.43, dueDate: '05/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 14, amount: 571.43, dueDate: '05/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 14, amount: 571.43, dueDate: '05/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 14, amount: 571.43, dueDate: '05/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 14, amount: 571.43, dueDate: '05/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 14, amount: 571.43, dueDate: '05/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 14, amount: 571.43, dueDate: '05/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 14, amount: 571.43, dueDate: '05/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 14, amount: 571.43, dueDate: '05/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 14, amount: 571.43, dueDate: '05/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 14, amount: 571.43, dueDate: '05/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 14, amount: 571.43, dueDate: '05/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 14, amount: 571.43, dueDate: '05/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // ROSECLAIRE MOLINA - Entrada + 24 parcelas de R$ 312,50
    {
      clientName: 'ROSECLAIRE MOLINA',
      saleDate: '25/03/2025',
      totalAmount: 20000,
      payments: [
        { installment: null, total: null, amount: 2000, dueDate: '25/03/2025', status: 'PAID', type: 'ADVANCE', paidDate: '25/03/2025' },
        { installment: 1, total: 24, amount: 312.50, dueDate: '09/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 24, amount: 312.50, dueDate: '09/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 24, amount: 312.50, dueDate: '09/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 24, amount: 312.50, dueDate: '09/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 24, amount: 312.50, dueDate: '09/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 24, amount: 312.50, dueDate: '09/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 24, amount: 312.50, dueDate: '09/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 24, amount: 312.50, dueDate: '09/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 24, amount: 312.50, dueDate: '09/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 24, amount: 312.50, dueDate: '09/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 24, amount: 312.50, dueDate: '09/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 24, amount: 312.50, dueDate: '09/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 24, amount: 312.50, dueDate: '09/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 24, amount: 312.50, dueDate: '09/10/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 15, total: 24, amount: 312.50, dueDate: '09/11/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 16, total: 24, amount: 312.50, dueDate: '09/12/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 17, total: 24, amount: 312.50, dueDate: '09/01/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 18, total: 24, amount: 312.50, dueDate: '09/02/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 19, total: 24, amount: 312.50, dueDate: '09/03/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 20, total: 24, amount: 312.50, dueDate: '09/04/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 21, total: 24, amount: 312.50, dueDate: '09/05/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 22, total: 24, amount: 312.50, dueDate: '09/06/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 23, total: 24, amount: 312.50, dueDate: '09/07/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 24, total: 24, amount: 312.50, dueDate: '09/08/2027', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // CLAUDEMIR FERREIRA SOUTO - Entrada + 10 parcelas de R$ 1.190,00 (completas)
    {
      clientName: 'CLAUDEMIR FERREIRA SOUTO',
      saleDate: '15/04/2025',
      totalAmount: 23900,
      payments: [
        { installment: null, total: null, amount: 11900, dueDate: '15/04/2025', status: 'PAID', type: 'ADVANCE', paidDate: '15/04/2025' },
        { installment: 1, total: 10, amount: 1190, dueDate: '09/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 1190, dueDate: '09/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 1190, dueDate: '09/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 1190, dueDate: '09/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 1190, dueDate: '09/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 1190, dueDate: '09/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 1190, dueDate: '09/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 1190, dueDate: '09/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 1190, dueDate: '09/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 1190, dueDate: '09/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // AMANDA CONTI JACQUES - Entrada + 12 parcelas de R$ 533,33
    {
      clientName: 'AMANDA CONTI JACQUES',
      saleDate: '15/04/2025',
      totalAmount: 8900,
      payments: [
        { installment: null, total: null, amount: 2500, dueDate: '15/04/2025', status: 'PAID', type: 'ADVANCE', paidDate: '15/04/2025' },
        { installment: 1, total: 12, amount: 533.33, dueDate: '09/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 12, amount: 533.33, dueDate: '09/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 12, amount: 533.33, dueDate: '09/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 12, amount: 533.33, dueDate: '09/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 12, amount: 533.33, dueDate: '09/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 12, amount: 533.33, dueDate: '09/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 12, amount: 533.33, dueDate: '09/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 12, amount: 533.33, dueDate: '09/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 12, amount: 533.33, dueDate: '09/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 12, amount: 533.33, dueDate: '09/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 12, amount: 533.33, dueDate: '09/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 12, amount: 533.33, dueDate: '09/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // DIONATHA SISNEI DA ROSA - Pagamento à vista
    {
      clientName: 'DIONATHA SISNEI DA ROSA',
      saleDate: '13/05/2025',
      totalAmount: 19000,
      payments: [
        { installment: null, total: null, amount: 19000, dueDate: '13/05/2025', status: 'PAID', type: 'ADVANCE', paidDate: '13/05/2025' },
      ]
    },
    // MICHELLE FAGUNDES - Entrada + 12 parcelas de R$ 633,33
    {
      clientName: 'MICHELLE FAGUNDES',
      saleDate: '06/07/2025',
      totalAmount: 15600,
      payments: [
        { installment: null, total: null, amount: 8000, dueDate: '06/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '06/07/2025' },
        { installment: 1, total: 12, amount: 633.33, dueDate: '10/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 12, amount: 633.33, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 12, amount: 633.33, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 12, amount: 633.33, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 12, amount: 633.33, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 12, amount: 633.33, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 12, amount: 633.33, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 12, amount: 633.33, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 12, amount: 633.33, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 12, amount: 633.33, dueDate: '10/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 12, amount: 633.33, dueDate: '10/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 12, amount: 633.33, dueDate: '10/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // PROFIT SANTO INACIO - Parcelas únicas
    {
      clientName: 'PROFIT SANTO INACIO',
      saleDate: '06/07/2025',
      totalAmount: 4160,
      payments: [
        { installment: 1, total: 1, amount: 1560, dueDate: '21/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 1, total: 1, amount: 1000, dueDate: '20/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 1, total: 1, amount: 1600, dueDate: '15/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // PADARIA VO CHICA - Parcela única
    {
      clientName: 'PADARIA VO CHICA',
      saleDate: '10/07/2025',
      totalAmount: 300,
      payments: [
        { installment: 1, total: 1, amount: 300, dueDate: '11/07/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // EDER FERNANDO BICCA BORDÃO - Entrada + 3 parcelas de R$ 1.333,33
    {
      clientName: 'EDER FERNANDO BICCA BORDÃO',
      saleDate: '30/07/2025',
      totalAmount: 9000,
      payments: [
        { installment: null, total: null, amount: 5000, dueDate: '30/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '30/07/2025' },
        { installment: 1, total: 3, amount: 1333.33, dueDate: '05/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 3, amount: 1333.33, dueDate: '05/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 3, amount: 1333.33, dueDate: '05/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // SIMONI MARIZETE TITO MONTEIRO - 3 parcelas de R$ 1.300,00
    {
      clientName: 'SIMONI MARIZETE TITO MONTEIRO',
      saleDate: '30/07/2025',
      totalAmount: 3900,
      payments: [
        { installment: 1, total: 3, amount: 1300, dueDate: '15/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 3, amount: 1300, dueDate: '15/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 3, amount: 1300, dueDate: '15/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // GIANNE BENITES CATILLO - 6 parcelas de R$ 666,67
    {
      clientName: 'GIANNE BENITES CATILLO',
      saleDate: '30/07/2025',
      totalAmount: 4000,
      payments: [
        { installment: 1, total: 6, amount: 666.67, dueDate: '15/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 6, amount: 666.67, dueDate: '15/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 6, amount: 666.67, dueDate: '15/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 6, amount: 666.67, dueDate: '15/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 6, amount: 666.67, dueDate: '15/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 6, amount: 666.67, dueDate: '15/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // VOLMIR JOSE TONIETO - Entrada + parcela única
    {
      clientName: 'VOLMIR JOSE TONIETO',
      saleDate: '30/07/2025',
      totalAmount: 22000,
      payments: [
        { installment: null, total: null, amount: 13200, dueDate: '30/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '30/07/2025' },
        { installment: 1, total: 1, amount: 8800, dueDate: '20/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // LUDMILA DOS SANTOS ROBLES - Entrada + 15 parcelas de R$ 533,33 (ADICIONAL DE MODULOS)
    {
      clientName: 'LUDMILA DOS SANTOS ROBLES',
      saleDate: '30/07/2025',
      totalAmount: 15000,
      payments: [
        { installment: null, total: null, amount: 7000, dueDate: '30/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '30/07/2025' },
        { installment: 1, total: 15, amount: 533.33, dueDate: '20/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 15, amount: 533.33, dueDate: '20/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 15, amount: 533.33, dueDate: '20/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 15, amount: 533.33, dueDate: '20/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 15, amount: 533.33, dueDate: '20/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 15, amount: 533.33, dueDate: '20/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 15, amount: 533.33, dueDate: '20/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 15, amount: 533.33, dueDate: '20/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 15, amount: 533.33, dueDate: '20/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 15, amount: 533.33, dueDate: '20/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 15, amount: 533.33, dueDate: '20/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 15, amount: 533.33, dueDate: '20/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 15, amount: 533.33, dueDate: '20/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 15, amount: 533.33, dueDate: '20/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 15, total: 15, amount: 533.33, dueDate: '20/10/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // LUDMILA DOS SANTOS ROBLES - Segunda venda (VENDA EQUIPAMENTO)
    {
      clientName: 'LUDMILA DOS SANTOS ROBLES',
      saleDate: '30/07/2025',
      totalAmount: 15000,
      payments: [
        { installment: null, total: null, amount: 7000, dueDate: '30/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '30/07/2025' },
        { installment: 1, total: 15, amount: 533.33, dueDate: '15/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 15, amount: 533.33, dueDate: '15/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 15, amount: 533.33, dueDate: '15/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 15, amount: 533.33, dueDate: '15/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 15, amount: 533.33, dueDate: '15/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 15, amount: 533.33, dueDate: '15/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 15, amount: 533.33, dueDate: '15/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 15, amount: 533.33, dueDate: '15/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 15, amount: 533.33, dueDate: '15/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 15, amount: 533.33, dueDate: '15/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 15, amount: 533.33, dueDate: '15/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 15, amount: 533.33, dueDate: '15/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 15, amount: 533.33, dueDate: '15/10/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 15, amount: 533.33, dueDate: '15/11/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 15, total: 15, amount: 533.33, dueDate: '15/12/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // JONATHAN DA SILVEIRA DA SILVA - Parcela única
    {
      clientName: 'JONATHAN DA SILVEIRA DA SILVA',
      saleDate: '21/07/2025',
      totalAmount: 10000,
      payments: [
        { installment: 1, total: 1, amount: 10000, dueDate: '08/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // RAMON ANTONIO RAFFIN - Entrada + parcelas múltiplas (completas)
    {
      clientName: 'RAMON ANTONIO RAFFIN',
      saleDate: '16/07/2025',
      totalAmount: 15600,
      payments: [
        { installment: null, total: null, amount: 2000, dueDate: '16/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '16/07/2025' },
        { installment: 1, total: 2, amount: 3000, dueDate: '05/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 2, amount: 3000, dueDate: '05/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 1, total: 12, amount: 633.33, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 12, amount: 633.33, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 12, amount: 633.33, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 12, amount: 633.33, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 12, amount: 633.33, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 12, amount: 633.33, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 12, amount: 633.33, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 12, amount: 633.33, dueDate: '10/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 12, amount: 633.33, dueDate: '10/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 12, amount: 633.33, dueDate: '10/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 12, amount: 633.33, dueDate: '10/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 12, amount: 633.33, dueDate: '10/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // GISLAINE TSCHINKEL RODRIGUES - Entrada + múltiplas vendas
    {
      clientName: 'GISLAINE TSCHINKEL RODRIGUES',
      saleDate: '07/07/2025',
      totalAmount: 15600,
      payments: [
        { installment: null, total: null, amount: 4000, dueDate: '07/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '07/07/2025' },
        { installment: 1, total: 1, amount: 1800, dueDate: '07/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 1, total: 10, amount: 500, dueDate: '08/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 500, dueDate: '08/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 500, dueDate: '08/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 500, dueDate: '08/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 500, dueDate: '08/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 500, dueDate: '08/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 500, dueDate: '08/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 500, dueDate: '08/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 500, dueDate: '08/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 500, dueDate: '08/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // GISLAINE TSCHINKEL RODRIGUES - Segunda venda (R$ 10.800)
    {
      clientName: 'GISLAINE TSCHINKEL RODRIGUES',
      saleDate: '07/07/2025',
      totalAmount: 10800,
      payments: [
        { installment: 1, total: 10, amount: 500, dueDate: '08/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 500, dueDate: '08/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 500, dueDate: '08/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 500, dueDate: '08/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 500, dueDate: '08/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 500, dueDate: '08/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 500, dueDate: '08/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 500, dueDate: '08/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 500, dueDate: '08/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 500, dueDate: '08/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // GISLAINE TSCHINKEL RODRIGUES - Terceira venda (R$ 10.800)
    {
      clientName: 'GISLAINE TSCHINKEL RODRIGUES',
      saleDate: '07/07/2025',
      totalAmount: 10800,
      payments: [
        { installment: 1, total: 10, amount: 500, dueDate: '08/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 500, dueDate: '08/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 500, dueDate: '08/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 500, dueDate: '08/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 500, dueDate: '08/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 500, dueDate: '08/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 500, dueDate: '08/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 500, dueDate: '08/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 500, dueDate: '08/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 500, dueDate: '08/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // GISLAINE TSCHINKEL RODRIGUES - Quarta venda (R$ 10.800)
    {
      clientName: 'GISLAINE TSCHINKEL RODRIGUES',
      saleDate: '07/07/2025',
      totalAmount: 10800,
      payments: [
        { installment: 1, total: 10, amount: 500, dueDate: '08/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 10, amount: 500, dueDate: '08/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 10, amount: 500, dueDate: '08/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 10, amount: 500, dueDate: '08/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 10, amount: 500, dueDate: '08/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 10, amount: 500, dueDate: '08/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 10, amount: 500, dueDate: '08/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 10, amount: 500, dueDate: '08/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 10, amount: 500, dueDate: '08/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 10, amount: 500, dueDate: '08/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // EDGAR COLOMBO ELVINO DA SILVA - Pagamento à vista
    {
      clientName: 'EDGAR COLOMBO ELVINO DA SILVA',
      saleDate: '23/07/2025',
      totalAmount: 19000,
      payments: [
        { installment: null, total: null, amount: 19000, dueDate: '23/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '23/07/2025' },
      ]
    },
    // PANARIUS DISTRIBUIDORA LTDA - Entrada + 3 parcelas de R$ 5.500,00
    {
      clientName: 'PANARIUS DISTRIBUIDORA LTDA',
      saleDate: '30/07/2025',
      totalAmount: 46000,
      payments: [
        { installment: null, total: null, amount: 29500, dueDate: '30/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '30/07/2025' },
        { installment: 1, total: 3, amount: 5500, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 3, amount: 5500, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 3, amount: 5500, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // IEDA MADEIRA SALGADO - Entrada + 18 parcelas de R$ 1.494,44
    {
      clientName: 'IEDA MADEIRA SALGADO',
      saleDate: '02/07/2025',
      totalAmount: 51900,
      payments: [
        { installment: null, total: null, amount: 25000, dueDate: '02/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '02/07/2025' },
        { installment: 1, total: 18, amount: 1494.44, dueDate: '10/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 18, amount: 1494.44, dueDate: '10/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 18, amount: 1494.44, dueDate: '10/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 18, amount: 1494.44, dueDate: '10/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 18, amount: 1494.44, dueDate: '10/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 18, amount: 1494.44, dueDate: '10/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 18, amount: 1494.44, dueDate: '10/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 18, amount: 1494.44, dueDate: '10/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 18, amount: 1494.44, dueDate: '10/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 18, amount: 1494.44, dueDate: '10/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 18, amount: 1494.44, dueDate: '10/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 18, amount: 1494.44, dueDate: '10/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 18, amount: 1494.44, dueDate: '10/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 18, amount: 1494.44, dueDate: '10/10/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 15, total: 18, amount: 1494.44, dueDate: '10/11/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 16, total: 18, amount: 1494.44, dueDate: '10/12/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 17, total: 18, amount: 1494.44, dueDate: '10/01/2027', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 18, total: 18, amount: 1494.44, dueDate: '10/02/2027', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // JORGE LUIS BITTENCOURT MONTEIRO - Primeira venda
    {
      clientName: 'JORGE LUIS BITTENCOURT MONTEIRO',
      saleDate: '02/07/2025',
      totalAmount: 6000,
      payments: [
        { installment: null, total: null, amount: 1000, dueDate: '02/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '02/07/2025' },
        { installment: 1, total: 1, amount: 5000, dueDate: '05/08/2025', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
    // JORGE LUIS BITTENCOURT MONTEIRO - Segunda venda
    {
      clientName: 'JORGE LUIS BITTENCOURT MONTEIRO',
      saleDate: '02/07/2025',
      totalAmount: 25000,
      payments: [
        { installment: null, total: null, amount: 5000, dueDate: '02/07/2025', status: 'PAID', type: 'ADVANCE', paidDate: '02/07/2025' },
        { installment: 1, total: 14, amount: 1000, dueDate: '15/09/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 2, total: 14, amount: 1000, dueDate: '15/10/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 3, total: 14, amount: 1000, dueDate: '15/11/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 4, total: 14, amount: 1000, dueDate: '15/12/2025', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 5, total: 14, amount: 1000, dueDate: '15/01/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 6, total: 14, amount: 1000, dueDate: '15/02/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 7, total: 14, amount: 1000, dueDate: '15/03/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 8, total: 14, amount: 1000, dueDate: '15/04/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 9, total: 14, amount: 1000, dueDate: '15/05/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 10, total: 14, amount: 1000, dueDate: '15/06/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 11, total: 14, amount: 1000, dueDate: '15/07/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 12, total: 14, amount: 1000, dueDate: '15/08/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 13, total: 14, amount: 1000, dueDate: '15/09/2026', status: 'PENDING', type: 'INSTALLMENT' },
        { installment: 14, total: 14, amount: 1000, dueDate: '15/10/2026', status: 'PENDING', type: 'INSTALLMENT' },
      ]
    },
  ]

  // Criar clientes únicos dos dados fornecidos
  const clientNames = [
    'CLEINE DE FREITAS ARAUJO TAVARES',
    'APAE URUGUAIANA',
    'ALAMIR MOURA',
    'PAMPA GARDEN',
    'DAIANEBARBO COSTA',
    'CRISTINA JARDIM RIBEIRO',
    'CLOVES BORGES GOMES',
    'CARLOS ALBERT0 VIVIANE MARQUES',
    'ANDREIA BENITES MELO',
    'ANDERSON LUIS CRISTIANE',
    'DELFINO PRESTES DA SILVA',
    'DOUGLAS PEREIRA',
    'EDER FERNANDO BICCA',
    'EDSON GILMAR',
    'FABIANO DE MOURA',
    'ELIAS DA SILVA JUNIOR',
    'DAIANE BARBO COSTA',
    'MARLEIZA BISSACO DA SILVEIRA',
    'MAYSA LUCIANE RIBEIRO',
    'ELAINE DIAS PEREIRA DORNELES',
    'EDUARDO BULDAIN D ORNELLAS',
    'MARCELO ROSAMAR NUNES DE ARAUJO',
    'JOSE NEWTON DE FREITAS BETTEGA',
    'ANA PAULA RIBEIRO LUNARDINI',
    'ROSECLAIRE MOLINA',
    'CLAUDEMIR FERREIRA SOUTO',
    'AMANDA CONTI JACQUES',
    'DIONATHA SISNEI DA ROSA',
    'MICHELLE FAGUNDES',
    'PROFIT SANTO INACIO',
    'PADARIA VO CHICA',
    'EDER FERNANDO BICCA BORDÃO',
    'SIMONI MARIZETE TITO MONTEIRO',
    'GIANNE BENITES CATILLO',
    'VOLMIR JOSE TONIETO',
    'LUDMILA DOS SANTOS ROBLES',
    'JONATHAN DA SILVEIRA DA SILVA',
    'RAMON ANTONIO RAFFIN',
    'GISLAINE TSCHINKEL RODRIGUES',
    'EDGAR COLOMBO ELVINO DA SILVA',
    'PANARIUS DISTRIBUIDORA LTDA',
    'IEDA MADEIRA SALGADO',
    'JORGE LUIS BITTENCOURT MONTEIRO'
  ]

  // Criar clientes com datas baseadas nas vendas
  const clients = []
  for (const name of clientNames) {
    // Encontrar a primeira venda deste cliente para usar como data de criação
    const firstSale = paymentData.find(p => p.clientName === name)
    const createdAt = firstSale ? parseBrazilianDate(firstSale.saleDate) : new Date()
    
    const client = await prisma.client.create({
      data: {
        name: name,
        userId: user.id,
        organizationId: organization.id,
        createdAt: createdAt,
      },
    })
    clients.push(client)
  }

  console.log('👥 Clientes criados:', clients.length)

  // Criar vendas e pagamentos
  for (const saleData of paymentData) {
    const client = clients.find(c => c.name === saleData.clientName)
    if (!client) continue

    // Criar venda
    const sale = await prisma.sale.create({
      data: {
        clientId: client.id,
        totalAmount: saleData.totalAmount,
        saleDate: parseBrazilianDate(saleData.saleDate),
        notes: 'Venda importada do sistema anterior',
        userId: user.id,
        organizationId: organization.id,
      },
    })

    // Criar pagamentos
    for (const payment of saleData.payments) {
      await prisma.salePayment.create({
        data: {
          saleId: sale.id,
          type: payment.type as 'ADVANCE' | 'INSTALLMENT',
          amount: payment.amount,
          dueDate: parseBrazilianDate(payment.dueDate),
          status: payment.status as 'PENDING' | 'PAID' | 'OVERDUE',
          paidDate: payment.paidDate ? parseBrazilianDate(payment.paidDate) : null,
          installmentNumber: payment.installment,
          totalInstallments: payment.total,
        },
      })
    }

    console.log(`💰 Venda criada para ${saleData.clientName}: R$ ${saleData.totalAmount.toFixed(2)}`)
  }

  console.log('✅ Seed com dados financeiros concluído!')
  console.log(`📊 Total de vendas criadas: ${saleId - 1}`)
  console.log(`💳 Total de pagamentos criados: ${paymentId - 1}`)
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

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar usuário temporário
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'dev@sistema.com' },
    update: {},
    create: {
      id: 1,
      email: 'dev@sistema.com',
      name: 'Usuário de Desenvolvimento',
      password: hashedPassword,
    },
  })

  console.log('👤 Usuário criado:', user.email)

  // Criar organização
  const organization = await prisma.organization.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
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

  // Criar categorias de exemplo
  const categories = await Promise.all([
    prisma.expenseCategory.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Projetos',
        description: 'Despesas relacionadas a projetos',
        userId: user.id,
        organizationId: organization.id,
      },
    }),
    prisma.expenseCategory.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Fornecedores',
        description: 'Pagamentos a fornecedores',
        userId: user.id,
        organizationId: organization.id,
      },
    }),
    prisma.expenseCategory.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Funcionários',
        description: 'Salários e benefícios',
        userId: user.id,
        organizationId: organization.id,
      },
    }),
  ])

  console.log('📂 Categorias criadas:', categories.length)

  // Criar clientes de exemplo
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        address: 'Rua das Flores, 123',
        userId: user.id,
        organizationId: organization.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '(11) 88888-8888',
        address: 'Av. Principal, 456',
        userId: user.id,
        organizationId: organization.id,
      },
    }),
  ])

  console.log('👥 Clientes criados:', clients.length)

  console.log('✅ Seed concluído!')
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

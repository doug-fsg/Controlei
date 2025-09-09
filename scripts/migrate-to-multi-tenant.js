const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateToMultiTenant() {
  console.log('🚀 Iniciando migração para multi-tenant...')
  
  try {
    // 1. Buscar todos os usuários existentes
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true 
      }
    })

    console.log(`📊 Encontrados ${users.length} usuários para migrar`)

    for (const user of users) {
      console.log(`\n👤 Migrando usuário: ${user.name || user.email}`)
      
      // 2. Criar organização para cada usuário
      const organizationName = user.name 
        ? `${user.name}'s Business` 
        : `${user.email.split('@')[0]}'s Business`
      
      const organizationSlug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        + `-${user.id}`

      const organization = await prisma.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug,
        }
      })

      console.log(`🏢 Criada organização: ${organization.name} (${organization.slug})`)

      // 3. Associar usuário à organização como owner
      await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'owner',
          isActive: true,
        }
      })

      console.log(`🔗 Usuário associado como owner da organização`)

      // 4. Atualizar todos os dados do usuário para a nova organização
      const updatePromises = [
        // Clientes
        prisma.client.updateMany({
          where: { userId: user.id, organizationId: null },
          data: { organizationId: organization.id }
        }),
        
        // Vendas
        prisma.sale.updateMany({
          where: { userId: user.id, organizationId: null },
          data: { organizationId: organization.id }
        }),
        
        // Categorias de despesas
        prisma.expenseCategory.updateMany({
          where: { userId: user.id, organizationId: null },
          data: { organizationId: organization.id }
        }),
        
        // Despesas
        prisma.expense.updateMany({
          where: { userId: user.id, organizationId: null },
          data: { organizationId: organization.id }
        }),
        
        // Pagamentos recorrentes
        prisma.recurringExpensePayment.updateMany({
          where: { userId: user.id, organizationId: null },
          data: { organizationId: organization.id }
        })
      ]

      const results = await Promise.all(updatePromises)
      
      console.log(`📊 Dados migrados:`)
      console.log(`   - Clientes: ${results[0].count}`)
      console.log(`   - Vendas: ${results[1].count}`)
      console.log(`   - Categorias: ${results[2].count}`)
      console.log(`   - Despesas: ${results[3].count}`)
      console.log(`   - Pagamentos recorrentes: ${results[4].count}`)
    }

    console.log('\n✅ Migração concluída com sucesso!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Testar o sistema com os dados migrados')
    console.log('2. Atualizar as APIs para usar organizationId')
    console.log('3. Tornar organizationId obrigatório no schema')

  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateToMultiTenant()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { migrateToMultiTenant }



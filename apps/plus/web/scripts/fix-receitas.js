const { PrismaClient } = require('../generated/prisma')

const prisma = new PrismaClient()

async function fixReceitas() {
  try {
    console.log('🔍 Verificando receitas com dados faltando...')
    
    // Buscar todas as receitas
    const receitas = await prisma.receita.findMany({
      include: {
        ingredientes: {
          include: {
            ingrediente: true
          }
        }
      }
    })

    console.log(`📋 Encontradas ${receitas.length} receitas`)

    for (const receita of receitas) {
      let needsUpdate = false
      const updateData = {}

      // Verificar tempoPreparo
      if (!receita.tempoPreparo || receita.tempoPreparo === 0) {
        updateData.tempoPreparo = 60 // 60 minutos padrão
        needsUpdate = true
        console.log(`⏰ ${receita.nome}: adicionando tempo de preparo padrão (60 min)`)
      }

      // Verificar pesoUnitario
      if (!receita.pesoUnitario || receita.pesoUnitario === 0) {
        // Calcular peso baseado nos ingredientes
        let pesoTotal = 0
        receita.ingredientes.forEach(item => {
          pesoTotal += item.quantidade // quantidade já está em gramas
        })
        
        // Dividir pelo rendimento para obter peso unitário
        const pesoUnitario = Math.round(pesoTotal / receita.rendimento)
        updateData.pesoUnitario = pesoUnitario
        needsUpdate = true
        console.log(`⚖️  ${receita.nome}: calculando peso unitário (${pesoUnitario}g por unidade)`)
      }

      // Atualizar se necessário
      if (needsUpdate) {
        await prisma.receita.update({
          where: { id: receita.id },
          data: updateData
        })
        console.log(`✅ ${receita.nome}: atualizada`)
      } else {
        console.log(`✓ ${receita.nome}: já está completa`)
      }
    }

    console.log('\n🎉 Correção concluída!')
    
    // Mostrar resumo final
    const receitasAtualizadas = await prisma.receita.findMany({
      select: {
        nome: true,
        tempoPreparo: true,
        pesoUnitario: true,
        rendimento: true
      }
    })

    console.log('\n📊 Resumo das receitas:')
    receitasAtualizadas.forEach(receita => {
      console.log(`  ${receita.nome}:`)
      console.log(`    - Tempo: ${receita.tempoPreparo} min`)
      console.log(`    - Peso unitário: ${receita.pesoUnitario}g`)
      console.log(`    - Rendimento: ${receita.rendimento} unidades`)
    })

  } catch (error) {
    console.error('❌ Erro ao corrigir receitas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixReceitas() 
const { PrismaClient } = require('../generated/prisma')

const prisma = new PrismaClient()

async function fixPesosReceitas() {
  try {
    console.log('🔧 Corrigindo pesos unitários das receitas...')
    
    // Correções específicas baseadas em valores realistas
    const correcoes = [
      {
        nome: 'Pão Francês',
        pesoUnitario: 50, // 50g por pão francês
        tempoPreparo: 180
      },
      {
        nome: 'Bolo de Chocolate', 
        pesoUnitario: 1200, // 1.2kg para um bolo inteiro
        tempoPreparo: 90
      },
      {
        nome: 'Croissant',
        pesoUnitario: 80, // 80g por croissant
        tempoPreparo: 240
      },
      {
        nome: 'Pão Integral Rústico 70%',
        pesoUnitario: 800, // 800g para um pão integral
        tempoPreparo: 180
      }
    ]

    for (const correcao of correcoes) {
      const receita = await prisma.receita.findFirst({
        where: { nome: correcao.nome }
      })

      if (receita) {
        await prisma.receita.update({
          where: { id: receita.id },
          data: {
            pesoUnitario: correcao.pesoUnitario,
            tempoPreparo: correcao.tempoPreparo
          }
        })
        console.log(`✅ ${correcao.nome}: peso ${correcao.pesoUnitario}g, tempo ${correcao.tempoPreparo}min`)
      }
    }

    console.log('\n🎉 Pesos corrigidos!')
    
    // Mostrar resumo final
    const receitas = await prisma.receita.findMany({
      select: {
        nome: true,
        tempoPreparo: true,
        pesoUnitario: true,
        rendimento: true
      }
    })

    console.log('\n📊 Receitas atualizadas:')
    receitas.forEach(receita => {
      const pesoTotal = (receita.pesoUnitario || 0) * receita.rendimento
      console.log(`  ${receita.nome}:`)
      console.log(`    - ${receita.rendimento} unidade(s) de ${receita.pesoUnitario}g cada`)
      console.log(`    - Peso total: ${pesoTotal}g (${(pesoTotal/1000).toFixed(1)}kg)`)
      console.log(`    - Tempo: ${receita.tempoPreparo} min`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPesosReceitas() 
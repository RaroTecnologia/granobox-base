const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
});

async function checkAndCreateTiposManipulados() {
  try {
    console.log('🔍 Verificando tipos de manipulados...');
    
    // Primeiro, buscar uma organização existente
    const organizacao = await prisma.organizacao.findFirst({
      where: { ativo: true }
    });
    
    if (!organizacao) {
      console.log('❌ Nenhuma organização encontrada. Execute o seed-admin.js primeiro.');
      return;
    }
    
    console.log(`🏢 Usando organização: ${organizacao.nome}`);
    
    // Verificar tipos existentes
    const tiposExistentes = await prisma.tipoManipulado.findMany({
      where: { 
        ativo: true,
        organizacaoId: organizacao.id
      }
    });
    
    console.log(`📊 Tipos encontrados: ${tiposExistentes.length}`);
    
    if (tiposExistentes.length === 0) {
      console.log('➕ Criando tipos de exemplo...');
      
      const tiposExemplo = [
        {
          organizacaoId: organizacao.id,
          nome: 'Massa de Bolo',
          descricao: 'Massa básica para bolos',
          categoria: 'massa',
          unidade: 'kg',
          estoqueMinimo: 5,
          custoUnitario: 15.00,
          conservacaoRecomendada: 'TEMPERATURA_AMBIENTE',
          validadeTemperaturaAmbiente: 1440, // 24 horas em minutos
          validadeRefrigerado: 4320, // 72 horas em minutos
          validadeCongelado: 43200, // 30 dias em minutos
          instrucoes: 'Manter em temperatura ambiente ou refrigerado',
          ativo: true
        },
        {
          organizacaoId: organizacao.id,
          nome: 'Creme de Chocolate',
          descricao: 'Creme de chocolate para recheios',
          categoria: 'creme',
          unidade: 'kg',
          estoqueMinimo: 3,
          custoUnitario: 25.00,
          conservacaoRecomendada: 'RESFRIADO',
          validadeTemperaturaAmbiente: 240, // 4 horas em minutos
          validadeRefrigerado: 2880, // 48 horas em minutos
          validadeCongelado: 43200, // 30 dias em minutos
          instrucoes: 'Manter refrigerado entre 2-8°C',
          ativo: true
        },
        {
          organizacaoId: organizacao.id,
          nome: 'Calda de Caramelo',
          descricao: 'Calda de caramelo para decoração',
          categoria: 'calda',
          unidade: 'l',
          estoqueMinimo: 2,
          custoUnitario: 20.00,
          conservacaoRecomendada: 'TEMPERATURA_AMBIENTE',
          validadeTemperaturaAmbiente: 2880, // 48 horas em minutos
          validadeRefrigerado: 5760, // 96 horas em minutos
          validadeCongelado: 43200, // 30 dias em minutos
          instrucoes: 'Manter em temperatura ambiente',
          ativo: true
        },
        {
          organizacaoId: organizacao.id,
          nome: 'Pasta de Baunilha',
          descricao: 'Pasta de baunilha para aromatização',
          categoria: 'pasta',
          unidade: 'kg',
          estoqueMinimo: 1,
          custoUnitario: 50.00,
          conservacaoRecomendada: 'TEMPERATURA_AMBIENTE',
          validadeTemperaturaAmbiente: 43200, // 30 dias em minutos
          validadeRefrigerado: 86400, // 60 dias em minutos
          validadeCongelado: 259200, // 180 dias em minutos
          instrucoes: 'Manter em temperatura ambiente, longe da luz',
          ativo: true
        }
      ];
      
      for (const tipo of tiposExemplo) {
        await prisma.tipoManipulado.create({
          data: tipo
        });
        console.log(`✅ Criado: ${tipo.nome}`);
      }
      
      console.log('🎉 Tipos de exemplo criados com sucesso!');
    } else {
      console.log('📋 Tipos existentes:');
      tiposExistentes.forEach(tipo => {
        console.log(`  - ${tipo.nome} (${tipo.categoria})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateTiposManipulados(); 
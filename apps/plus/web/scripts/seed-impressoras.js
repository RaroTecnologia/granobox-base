const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('🖨️  Populando configurações de impressora...');

  // Configurações padrão de impressoras
  const configuracoes = [
    {
      nome: 'Impressora Cozinha (TCP/IP)',
      tipo: 'EPSON',
      interface: 'tcp://192.168.1.100:9100',
      largura: 48,
      ativa: true
    },
    {
      nome: 'Impressora USB',
      tipo: 'EPSON',
      interface: 'usb',
      largura: 48,
      ativa: false
    },
    {
      nome: 'Impressora Bluetooth',
      tipo: 'STAR',
      interface: 'bluetooth',
      largura: 32,
      ativa: false
    }
  ];

  for (const config of configuracoes) {
    // Verificar se já existe
    const existente = await prisma.configuracaoImpressora.findFirst({
      where: { nome: config.nome }
    });

    if (!existente) {
      const impressora = await prisma.configuracaoImpressora.create({
        data: config
      });
      console.log(`✅ Configuração criada: ${impressora.nome}`);
    } else {
      console.log(`⚠️  Configuração já existe: ${config.nome}`);
    }
  }

  console.log('🎉 Configurações de impressora populadas com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao popular configurações:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
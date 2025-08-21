const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log('🔧 Verificando e corrigindo senhas dos usuários...\n');

    // Buscar todos os usuários
    const usuarios = await prisma.usuario.findMany({
      include: {
        organizacao: true
      }
    });

    console.log(`📊 Usuários encontrados: ${usuarios.length}`);

    for (const usuario of usuarios) {
      console.log(`\n👤 ${usuario.nome} (${usuario.email})`);
      console.log(`   Organização: ${usuario.organizacao?.nome || 'Sistema (Admin)'}`);
      
      // Definir senha padrão baseada no tipo de usuário
      let senhaPadrao = 'admin123';
      
      if (usuario.organizacao?.dominio) {
        // Usuário de organização - usar domínio como parte da senha
        senhaPadrao = `${usuario.organizacao.dominio}123`;
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(senhaPadrao, 12);

      // Atualizar senha
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { senha: senhaHash }
      });

      console.log(`   ✅ Senha atualizada: ${senhaPadrao}`);
    }

    console.log('\n🎉 Todas as senhas foram atualizadas!');
    console.log('\n📋 Credenciais de acesso:');
    
    for (const usuario of usuarios) {
      let senhaPadrao = 'admin123';
      if (usuario.organizacao?.dominio) {
        senhaPadrao = `${usuario.organizacao.dominio}123`;
      }
      
      console.log(`   ${usuario.email} | ${senhaPadrao} | ${usuario.organizacao?.dominio || 'admin'}`);
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir senhas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords(); 
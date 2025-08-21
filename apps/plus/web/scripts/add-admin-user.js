const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addAdminUser() {
  try {
    console.log('🔧 Adicionando usuário admin do sistema...');

    // Verificar se o usuário já existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        email: 'tiagomlevorato@gmail.com'
      }
    });

    if (existingUser) {
      console.log('⚠️  Usuário já existe!');
      console.log(`📧 Email: ${existingUser.email}`);
      console.log(`👤 Nome: ${existingUser.nome}`);
      console.log(`🏢 Organização: ${existingUser.organizacaoId || 'Sistema (Admin)'}`);
      return;
    }

    // Buscar permissão admin
    const permissaoAdmin = await prisma.permissao.findFirst({
      where: {
        nome: 'admin'
      }
    });

    if (!permissaoAdmin) {
      console.error('❌ Permissão admin não encontrada!');
      return;
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash('admin123', 12);

    // Criar usuário admin do sistema (sem organização)
    const usuarioAdmin = await prisma.usuario.create({
      data: {
        organizacaoId: null, // Admin do sistema
        nome: 'Tiago M. Levorato',
        email: 'tiagomlevorato@gmail.com',
        senha: senhaHash,
        cargo: 'Administrador do Sistema',
        ativo: true
      }
    });

    // Atribuir permissão admin
    await prisma.permissaoUsuario.create({
      data: {
        usuarioId: usuarioAdmin.id,
        permissaoId: permissaoAdmin.id
      }
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`📧 Email: ${usuarioAdmin.email}`);
    console.log(`👤 Nome: ${usuarioAdmin.nome}`);
    console.log(`🔑 Senha: admin123`);
    console.log(`🔐 Permissão: ${permissaoAdmin.nome}`);
    console.log(`🏢 Tipo: Administrador do Sistema`);

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminUser(); 
const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco...\n');

    // Buscar todas as organizações
    const organizacoes = await prisma.organizacao.findMany({
      include: {
        usuarios: true
      }
    });

    console.log(`📊 Organizações encontradas: ${organizacoes.length}`);
    organizacoes.forEach(org => {
      console.log(`  - ${org.nome} (${org.dominio}) - ${org.usuarios.length} usuários`);
    });

    // Buscar usuários admin do sistema
    const adminUsers = await prisma.usuario.findMany({
      where: {
        organizacaoId: null
      },
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        }
      }
    });

    console.log(`\n👑 Usuários admin do sistema: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.nome} (${user.email}) - Permissões: ${user.permissoes.map(p => p.permissao.nome).join(', ')}`);
    });

    // Buscar usuários de organizações
    const orgUsers = await prisma.usuario.findMany({
      where: {
        organizacaoId: {
          not: null
        }
      },
      include: {
        organizacao: true,
        permissoes: {
          include: {
            permissao: true
          }
        }
      }
    });

    console.log(`\n👥 Usuários de organizações: ${orgUsers.length}`);
    orgUsers.forEach(user => {
      console.log(`  - ${user.nome} (${user.email}) - ${user.organizacao?.nome} - Permissões: ${user.permissoes.map(p => p.permissao.nome).join(', ')}`);
    });

    // Se não houver usuários de organização, criar um de teste
    if (orgUsers.length === 0 && organizacoes.length > 0) {
      console.log('\n🔧 Criando usuário de teste para organização...');
      
      const primeiraOrg = organizacoes[0];
      const senhaHash = await bcrypt.hash('teste123', 12);
      
      // Buscar permissão gerente
      const permissaoGerente = await prisma.permissao.findFirst({
        where: {
          nome: 'gerente'
        }
      });

      if (!permissaoGerente) {
        console.error('❌ Permissão gerente não encontrada!');
        return;
      }

      const usuarioTeste = await prisma.usuario.create({
        data: {
          organizacaoId: primeiraOrg.id,
          nome: 'Usuário Teste',
          email: 'teste@exemplo.com',
          senha: senhaHash,
          cargo: 'Gerente',
          ativo: true
        }
      });

      // Atribuir permissão gerente
      await prisma.permissaoUsuario.create({
        data: {
          usuarioId: usuarioTeste.id,
          permissaoId: permissaoGerente.id
        }
      });

      console.log('✅ Usuário de teste criado!');
      console.log(`📧 Email: ${usuarioTeste.email}`);
      console.log(`🔑 Senha: teste123`);
      console.log(`🏢 Organização: ${primeiraOrg.nome} (${primeiraOrg.dominio})`);
      console.log(`🔐 Permissão: ${permissaoGerente.nome}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 
const { PrismaClient } = require('../generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    console.log('🌱 Iniciando seed do sistema administrativo...')

    // Criar planos
    console.log('📋 Criando planos...')
    const planos = await Promise.all([
      prisma.plano.create({
        data: {
          nome: 'Básico',
          descricao: 'Ideal para pequenas padarias e docerias',
          preco: 49.90,
          moeda: 'BRL',
          periodo: 'mensal',
          recursos: {
            usuarios: 2,
            receitas: 50,
            backup: false,
            suporte: 'email'
          },
          ativo: true
        }
      }),
      prisma.plano.create({
        data: {
          nome: 'Profissional',
          descricao: 'Para padarias em crescimento',
          preco: 99.90,
          moeda: 'BRL',
          periodo: 'mensal',
          recursos: {
            usuarios: 5,
            receitas: 200,
            backup: true,
            suporte: 'email_e_telefone'
          },
          ativo: true
        }
      }),
      prisma.plano.create({
        data: {
          nome: 'Enterprise',
          descricao: 'Para grandes operações e redes',
          preco: 199.90,
          moeda: 'BRL',
          periodo: 'mensal',
          recursos: {
            usuarios: 15,
            receitas: 1000,
            backup: true,
            suporte: 'dedicado',
            api: true
          },
          ativo: true
        }
      })
    ])

    console.log(`✅ ${planos.length} planos criados`)

    // Criar permissões
    console.log('🔐 Criando permissões...')
    const permissoes = await Promise.all([
      prisma.permissao.create({
        data: {
          nome: 'admin',
          descricao: 'Administrador completo do sistema',
          recursos: {
            receitas: ['read', 'write', 'delete'],
            ingredientes: ['read', 'write', 'delete'],
            pedidos: ['read', 'write', 'delete'],
            producao: ['read', 'write', 'delete'],
            clientes: ['read', 'write', 'delete'],
            usuarios: ['read', 'write', 'delete'],
            configuracoes: ['read', 'write'],
            relatorios: ['read']
          },
          ativo: true
        }
      }),
      prisma.permissao.create({
        data: {
          nome: 'gerente',
          descricao: 'Gerente com acesso amplo',
          recursos: {
            receitas: ['read', 'write'],
            ingredientes: ['read', 'write'],
            pedidos: ['read', 'write'],
            producao: ['read', 'write'],
            clientes: ['read', 'write'],
            usuarios: ['read'],
            configuracoes: ['read'],
            relatorios: ['read']
          },
          ativo: true
        }
      }),
      prisma.permissao.create({
        data: {
          nome: 'operador',
          descricao: 'Operador de produção',
          recursos: {
            receitas: ['read'],
            ingredientes: ['read'],
            pedidos: ['read', 'write'],
            producao: ['read', 'write'],
            clientes: ['read'],
            usuarios: [],
            configuracoes: [],
            relatorios: ['read']
          },
          ativo: true
        }
      }),
      prisma.permissao.create({
        data: {
          nome: 'visualizador',
          descricao: 'Apenas visualização',
          recursos: {
            receitas: ['read'],
            ingredientes: ['read'],
            pedidos: ['read'],
            producao: ['read'],
            clientes: ['read'],
            usuarios: [],
            configuracoes: [],
            relatorios: ['read']
          },
          ativo: true
        }
      })
    ])

    console.log(`✅ ${permissoes.length} permissões criadas`)

    // Criar organização de exemplo (Granobox)
    console.log('🏢 Criando organização Granobox...')
    const organizacaoGranobox = await prisma.organizacao.create({
      data: {
        nome: 'Granobox',
        razaoSocial: 'Granobox Sistemas Ltda',
        documento: '00.000.000/0001-00', // CNPJ
        email: 'admin@granobox.com',
        telefone: '(11) 99999-9999',
        endereco: {
          rua: 'Rua das Tecnologias',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        },
        dominio: 'admin',
        ativo: true
      }
    })

    // Criar assinatura para Granobox
    await prisma.assinatura.create({
      data: {
        organizacaoId: organizacaoGranobox.id,
        planoId: planos[2].id, // Enterprise
        status: 'ativa',
        valor: 199.90,
        moeda: 'BRL'
      }
    })

    // Hash da senha para admin
    const senhaAdminHash = await bcrypt.hash('admin123', 12)

    // Criar usuário admin
    const usuarioAdmin = await prisma.usuario.create({
      data: {
        organizacaoId: organizacaoGranobox.id,
        nome: 'Administrador Granobox',
        email: 'admin@granobox.com',
        senha: senhaAdminHash,
        cargo: 'Administrador',
        ativo: true
      }
    })

    // Atribuir permissão admin
    await prisma.permissaoUsuario.create({
      data: {
        usuarioId: usuarioAdmin.id,
        permissaoId: permissoes[0].id // admin
      }
    })

    // Criar configurações da organização
    await prisma.configuracaoOrganizacao.create({
      data: {
        organizacaoId: organizacaoGranobox.id,
        tema: 'light',
        idioma: 'pt-BR',
        fusoHorario: 'America/Sao_Paulo',
        moeda: 'BRL',
        formatoData: 'dd/MM/yyyy',
        formatoHora: 'HH:mm'
      }
    })

    console.log('✅ Organização Granobox criada com sucesso')

    // Criar organização de exemplo (Padaria)
    console.log('🥖 Criando organização de exemplo...')
    const organizacaoPadaria = await prisma.organizacao.create({
      data: {
        nome: 'Padaria do João',
        razaoSocial: 'João Silva Ltda',
        documento: '12.345.678/0001-90', // CNPJ
        email: 'joao@padaria.com',
        telefone: '(11) 99999-9999',
        endereco: {
          rua: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        },
        dominio: 'joao',
        ativo: true
      }
    })

    // Criar assinatura para Padaria
    await prisma.assinatura.create({
      data: {
        organizacaoId: organizacaoPadaria.id,
        planoId: planos[1].id, // Profissional
        status: 'ativa',
        valor: 99.90,
        moeda: 'BRL'
      }
    })

    // Hash da senha para padaria
    const senhaPadariaHash = await bcrypt.hash('joao123', 12)

    // Criar usuário da padaria
    const usuarioPadaria = await prisma.usuario.create({
      data: {
        organizacaoId: organizacaoPadaria.id,
        nome: 'João Silva',
        email: 'joao@padaria.com',
        senha: senhaPadariaHash,
        cargo: 'Proprietário',
        ativo: true
      }
    })

    // Atribuir permissão gerente
    await prisma.permissaoUsuario.create({
      data: {
        usuarioId: usuarioPadaria.id,
        permissaoId: permissoes[1].id // gerente
      }
    })

    console.log('✅ Organização de exemplo criada com sucesso')

    // Criar organização com CPF (pessoa física)
    console.log('👤 Criando organização pessoa física...')
    const organizacaoPF = await prisma.organizacao.create({
      data: {
        nome: 'Doceria da Maria',
        razaoSocial: 'Maria Santos',
        documento: '123.456.789-00', // CPF
        email: 'maria@doceria.com',
        telefone: '(11) 88888-8888',
        endereco: {
          rua: 'Rua dos Doces',
          numero: '456',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        },
        dominio: 'maria',
        ativo: true
      }
    })

    // Criar assinatura para Doceria
    await prisma.assinatura.create({
      data: {
        organizacaoId: organizacaoPF.id,
        planoId: planos[0].id, // Básico
        status: 'ativa',
        valor: 49.90,
        moeda: 'BRL'
      }
    })

    // Hash da senha para doceria
    const senhaDoceriaHash = await bcrypt.hash('maria123', 12)

    // Criar usuário da doceria
    const usuarioDoceria = await prisma.usuario.create({
      data: {
        organizacaoId: organizacaoPF.id,
        nome: 'Maria Santos',
        email: 'maria@doceria.com',
        senha: senhaDoceriaHash,
        cargo: 'Proprietária',
        ativo: true
      }
    })

    // Atribuir permissão gerente
    await prisma.permissaoUsuario.create({
      data: {
        usuarioId: usuarioDoceria.id,
        permissaoId: permissoes[1].id // gerente
      }
    })

    console.log('✅ Organização pessoa física criada com sucesso')

    // Criar usuário admin do sistema (sem organização)
    console.log('👑 Criando usuário admin do sistema...')
    const senhaAdminSistemaHash = await bcrypt.hash('admin123', 12)
    
    const usuarioAdminSistema = await prisma.usuario.create({
      data: {
        organizacaoId: null, // Usuário admin do sistema
        nome: 'Admin Sistema',
        email: 'admin@sistema.com',
        senha: senhaAdminSistemaHash,
        cargo: 'Administrador do Sistema',
        ativo: true
      }
    })

    // Atribuir permissão admin
    await prisma.permissaoUsuario.create({
      data: {
        usuarioId: usuarioAdminSistema.id,
        permissaoId: permissoes[0].id // admin
      }
    })

    console.log('✅ Usuário admin do sistema criado com sucesso')

    console.log('🎉 Seed do sistema administrativo concluído!')
    console.log('\n📊 Resumo:')
    console.log(`- ${planos.length} planos criados`)
    console.log(`- ${permissoes.length} permissões criadas`)
    console.log('- 3 organizações criadas (Granobox + Padaria CNPJ + Doceria CPF)')
    console.log('- 4 usuários criados com permissões')
    console.log('\n🔑 Credenciais de teste:')
    console.log('- Admin Sistema: admin@sistema.com / admin123')
    console.log('- Admin Granobox: admin@granobox.com / admin123')
    console.log('- Padaria João: joao@padaria.com / joao123')
    console.log('- Doceria Maria: maria@doceria.com / maria123')

  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('✅ Script executado com sucesso')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error)
      process.exit(1)
    })
}

module.exports = { seedAdmin } 
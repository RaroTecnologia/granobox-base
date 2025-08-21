import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../generated/prisma'

const prisma = new PrismaClient()

// GET - Buscar configurações do sistema
export async function GET() {
  try {
    console.log('Buscando configurações...')
    
    // Buscar configurações existentes ou criar padrão
    let configuracoes = await prisma.configuracaoSistema.findFirst()
    console.log('Configurações encontradas:', configuracoes)

    if (!configuracoes) {
      console.log('Criando configurações padrão...')
      // Criar configurações padrão se não existirem
      configuracoes = await prisma.configuracaoSistema.create({
        data: {
          nomeEmpresa: 'Granobox',
          emailSuporte: 'suporte@granobox.com',
          telefoneSuporte: '(11) 99999-9999',
          endereco: 'São Paulo, SP',
          cnpj: '00.000.000/0001-00',
          corPrimaria: '#f2811d',
          corSecundaria: '#0ea5e9',
          timezone: 'America/Sao_Paulo',
          idioma: 'pt-BR',
          moeda: 'BRL',
          backupAutomatico: true,
          notificacoesEmail: true,
          notificacoesSMS: false,
          politicaSenha: {
            tamanhoMinimo: 8,
            caracteresEspeciais: true,
            numeros: true,
            maiusculas: true
          },
          sessao: {
            tempoExpiracao: 24,
            maximoSessoes: 5
          },
          pagamento: {
            gateway: 'stripe',
            modoTeste: true,
            webhookUrl: ''
          }
        }
      })
      console.log('Configurações criadas:', configuracoes)
    }

    return NextResponse.json(configuracoes)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configurações do sistema
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nomeEmpresa || !body.emailSuporte) {
      return NextResponse.json(
        { error: 'Nome da empresa e email de suporte são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar configurações existentes
    let configuracoes = await prisma.configuracaoSistema.findFirst()

    if (configuracoes) {
      // Atualizar configurações existentes
      configuracoes = await prisma.configuracaoSistema.update({
        where: { id: configuracoes.id },
        data: {
          nomeEmpresa: body.nomeEmpresa,
          emailSuporte: body.emailSuporte,
          telefoneSuporte: body.telefoneSuporte,
          endereco: body.endereco,
          cnpj: body.cnpj,
          corPrimaria: body.corPrimaria,
          corSecundaria: body.corSecundaria,
          timezone: body.timezone,
          idioma: body.idioma,
          moeda: body.moeda,
          backupAutomatico: body.backupAutomatico,
          notificacoesEmail: body.notificacoesEmail,
          notificacoesSMS: body.notificacoesSMS,
          politicaSenha: body.politicaSenha,
          sessao: body.sessao,
          pagamento: body.pagamento
        }
      })
    } else {
      // Criar novas configurações
      configuracoes = await prisma.configuracaoSistema.create({
        data: {
          nomeEmpresa: body.nomeEmpresa,
          emailSuporte: body.emailSuporte,
          telefoneSuporte: body.telefoneSuporte,
          endereco: body.endereco,
          cnpj: body.cnpj,
          corPrimaria: body.corPrimaria,
          corSecundaria: body.corSecundaria,
          timezone: body.timezone,
          idioma: body.idioma,
          moeda: body.moeda,
          backupAutomatico: body.backupAutomatico,
          notificacoesEmail: body.notificacoesEmail,
          notificacoesSMS: body.notificacoesSMS,
          politicaSenha: body.politicaSenha,
          sessao: body.sessao,
          pagamento: body.pagamento
        }
      })
    }

    return NextResponse.json({
      message: 'Configurações atualizadas com sucesso',
      configuracoes
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
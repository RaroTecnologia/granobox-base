import NextAuth from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '../../../../generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        dominio: { label: 'Operação', type: 'text' }
      },
      async authorize(credentials) {
        console.log('🔐 Tentativa de login:', {
          email: credentials?.email,
          dominio: credentials?.dominio,
          hasPassword: !!credentials?.password
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Email ou senha não fornecidos')
          return null
        }

        try {
          // Buscar usuário por email e domínio
          const user = await prisma.usuario.findFirst({
            where: {
              email: credentials.email,
              ativo: true,
              ...(credentials.dominio === 'admin' 
                ? { organizacaoId: null } // Admin do sistema
                : { 
                    organizacao: {
                      dominio: credentials.dominio
                    }
                  }
              )
            },
            include: {
              organizacao: true,
              permissoes: {
                include: {
                  permissao: true
                }
              }
            }
          })

          if (!user) {
            console.log('❌ Usuário não encontrado')
            return null
          }

          console.log('✅ Usuário encontrado:', {
            id: user.id,
            nome: user.nome,
            organizacaoId: user.organizacaoId,
            organizacao: user.organizacao?.nome
          })

          // Verificar senha
          if (!user.senha) {
            console.log('❌ Usuário sem senha')
            return null
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.senha)
          
          if (!isPasswordValid) {
            console.log('❌ Senha inválida')
            return null
          }

          console.log('✅ Senha válida')

          // Retornar dados do usuário (sem senha)
          return {
            id: user.id,
            email: user.email,
            name: user.nome,
            organizacaoId: user.organizacaoId || undefined,
            organizacao: user.organizacao ? {
              id: user.organizacao.id,
              nome: user.organizacao.nome
            } : undefined,
            permissoes: user.permissoes.map(p => p.permissao.nome),
            isAdmin: credentials.dominio === 'admin' || !user.organizacaoId
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.organizacaoId = user.organizacaoId
        token.organizacao = user.organizacao
        token.permissoes = user.permissoes
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!
        session.user.organizacaoId = token.organizacaoId
        session.user.organizacao = token.organizacao
        session.user.permissoes = token.permissoes
        session.user.isAdmin = token.isAdmin
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 
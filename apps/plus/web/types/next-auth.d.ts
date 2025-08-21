import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      organizacaoId?: string
      organizacao?: {
        id: string
        nome: string
      }
      permissoes: string[]
      isAdmin: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    organizacaoId?: string
    organizacao?: {
      id: string
      nome: string
    }
    permissoes: string[]
    isAdmin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    organizacaoId?: string
    organizacao?: {
      id: string
      nome: string
    }
    permissoes: string[]
    isAdmin: boolean
  }
} 
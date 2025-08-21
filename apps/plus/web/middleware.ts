import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth

    // Rotas públicas que não precisam de autenticação
    const publicRoutes = [
      '/auth/login', 
      '/auth/error', 
      '/auth/help', 
      '/auth/signup',
      '/api/health',
      '/api/mobile'
    ]
    
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Se não há token, redirecionar para login
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Proteger rotas admin
    if (pathname.startsWith('/admin')) {
      if (!token.isAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Proteger rotas de configurações (apenas usuários de organizações)
    if (pathname.startsWith('/configuracoes')) {
      if (token.isAdmin) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso a rotas públicas mesmo sem token
        const publicRoutes = [
          '/auth/login', 
          '/auth/error', 
          '/auth/help', 
          '/auth/signup',
          '/api/health',
          '/api/mobile'
        ]
        if (publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
          return true
        }
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 
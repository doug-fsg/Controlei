import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/api/auth/register',
    '/api/health'
  ]
  
  // Rotas da API de autenticação do NextAuth
  const authApiRoutes = pathname.startsWith('/api/auth/')
  
  // Se é uma rota pública ou da API de auth, permite acesso
  if (publicRoutes.includes(pathname) || authApiRoutes) {
    return NextResponse.next()
  }
  
  // Se não está autenticado e tentando acessar rota protegida
  if (!req.auth && pathname !== '/auth/signin') {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // Se está autenticado e tentando acessar páginas de auth, redireciona para dashboard
  if (req.auth && (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}

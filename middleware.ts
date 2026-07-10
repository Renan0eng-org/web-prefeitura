import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const hasSession = request.cookies.has('refresh_token')

  if (pathname.startsWith('/admin')) {
    if (!hasSession) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/sign-up')) {
    if (hasSession) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*', '/auth/:path*'],
}

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'refresh_token';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasSession = request.cookies.has(COOKIE_NAME);

    // Raiz -> /admin
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Protege /admin: sem sessao -> login (guardando a rota de origem)
    if (pathname.startsWith('/admin') && !hasSession) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Ja logado tentando acessar login/cadastro -> /admin
    if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/sign-up')) && hasSession) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/admin/:path*', '/auth/:path*'],
};

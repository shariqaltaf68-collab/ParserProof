import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPaths = [
  '/dashboard',
  '/new',
  '/results',
  '/history',
  '/settings',
  '/billing',
];

const authPaths = ['/login', '/signup'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  const isAuthPath = authPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/new/:path*',
    '/results/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/login',
    '/signup',
  ],
};

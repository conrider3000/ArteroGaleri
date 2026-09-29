import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin');
  const isOnAuth = req.nextUrl.pathname.startsWith('/auth');

  if (isOnAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl));
  }

  if (isOnAuth && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
};
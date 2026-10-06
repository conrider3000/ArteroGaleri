import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  if (req.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin');
  const isOnSignin = req.nextUrl.pathname === '/auth/signin';

  if (isOnAdmin && !isLoggedIn) {
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl));
  }

  if (isOnSignin && isLoggedIn) {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') || '/admin';
    return NextResponse.redirect(new URL(callbackUrl, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/auth/signin'],
};
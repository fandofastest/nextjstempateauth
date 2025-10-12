import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Middleware sederhana yang hanya melindungi rute user
export default withAuth(
  // Fungsi middleware dijalankan setelah otentikasi berhasil
  function middleware(req) {
    // Log untuk debugging
    console.log('Middleware running for path:', req.nextUrl.pathname);
    const url = req.nextUrl;
    const token = (req as any).nextauth?.token as any;

    // Jika user sudah login tapi bukan admin dan mencoba akses /user,
    // izinkan akses khusus ke /user/files untuk fitur upload dan /user/profile untuk profil.
    if (url.pathname.startsWith('/user')) {
      const role = token?.role;
      if (role && role !== 'admin') {
        // Allow customers to access user root, files module, and profile
        if (url.pathname === '/user' || 
            url.pathname.startsWith('/user/files') || 
            url.pathname.startsWith('/user/profile')) {
          return NextResponse.next();
        }
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Izinkan semua user yang memiliki token untuk melewati middleware function di atas.
      // Pembatasan akses admin dilakukan via redirect eksplisit.
      authorized: ({ token, req }) => {
        const ok = !!token;
        if (!ok) {
          console.log('No token in middleware, redirecting to signIn');
        } else {
          console.log('Token in middleware:', token);
        }
        return ok;
      },
    },
    pages: {
      // Jika tidak terautentikasi, redirect ke halaman signin
      signIn: '/signin',
    },
  }
);

// Hanya terapkan middleware ini ke rute user
export const config = {
  matcher: ['/user/:path*'],
};
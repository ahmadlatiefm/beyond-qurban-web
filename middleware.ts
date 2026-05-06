import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Sudah login tapi buka /admin/login → redirect langsung ke dashboard
    if (pathname === '/admin/login' && token) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Halaman login selalu boleh diakses (redirect ditangani di middleware fn)
        if (pathname === '/admin/login') return true
        // Semua halaman admin lain butuh token
        return !!token
      },
    },
  }
)

export const config = {
  // Tangani semua route /admin/* termasuk /admin/login
  matcher: ['/admin/:path*'],
}

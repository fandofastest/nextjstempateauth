import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyToken } from '@/lib/auth'

// GET /api/auth/test
// Validate token from Authorization: Bearer <JWT> or NextAuth session cookie.
// Returns the decoded user payload so you can verify identity/role quickly.
export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null

    if (bearer) {
      const decoded = verifyToken(bearer)
      if (decoded) {
        return NextResponse.json({ ok: true, via: 'bearer', user: decoded })
      }
      // Fallback to NextAuth cookie if bearer present but invalid
      const cookieUser = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
      if (cookieUser) return NextResponse.json({ ok: true, via: 'nextauth', user: cookieUser })
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 })
    }

    // No bearer -> try NextAuth session cookie
    const cookieUser = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!cookieUser) return NextResponse.json({ ok: false, message: 'No token provided' }, { status: 401 })
    return NextResponse.json({ ok: true, via: 'nextauth', user: cookieUser })
  } catch (err) {
    return NextResponse.json({ ok: false, message: 'Failed to validate token' }, { status: 500 })
  }
}

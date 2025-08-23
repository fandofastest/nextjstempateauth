import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Role from '@/models/Role';
import { verifyToken } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

async function requireAdmin(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      if (decoded.role !== 'admin') return { ok: false, res: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) } as const;
      return { ok: true, user: decoded } as const;
    }
    // Bearer provided but invalid; attempt fallback to NextAuth cookie session
    const nextAuthTokenFromBearerFail = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!nextAuthTokenFromBearerFail) return { ok: false, res: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) } as const;
    if ((nextAuthTokenFromBearerFail as any).role !== 'admin') return { ok: false, res: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) } as const;
    return { ok: true, user: nextAuthTokenFromBearerFail } as const;
  }

  const nextAuthToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!nextAuthToken) return { ok: false, res: NextResponse.json({ message: 'No token provided' }, { status: 401 }) } as const;
  if (nextAuthToken.role !== 'admin') return { ok: false, res: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) } as const;
  return { ok: true, user: nextAuthToken } as const;
}

// GET /api/roles -> list roles (admin only)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const roles = await Role.find().sort({ createdAt: -1 });
    return NextResponse.json({ roles });
  } catch (err: any) {
    console.error('GET /api/roles error:', err);
    return NextResponse.json({ message: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST /api/roles -> create role (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const { name, description, permissions } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ message: 'Name and description are required' }, { status: 400 });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return NextResponse.json({ message: 'Role name already exists' }, { status: 409 });
    }

    const role = new Role({ name, description, permissions: Array.isArray(permissions) ? permissions : [] });
    await role.save();

    return NextResponse.json({ role }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/roles error:', err);
    return NextResponse.json({ message: 'Failed to create role' }, { status: 500 });
  }
}

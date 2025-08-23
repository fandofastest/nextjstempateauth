import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CategoryModel from '@/models/Category';
import { verifyToken } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

async function requireUser(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    const decoded = verifyToken(token);
    if (!decoded) return { ok: false, res: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) } as const;
    return { ok: true, user: decoded } as const;
  }
  const nextAuthToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!nextAuthToken) return { ok: false, res: NextResponse.json({ message: 'No token provided' }, { status: 401 }) } as const;
  return { ok: true, user: nextAuthToken } as const;
}

// GET /api/categories -> list categories
export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;
    await dbConnect();
    const categories = await CategoryModel.find({}).sort({ name: 1 });
    return NextResponse.json({ categories });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to list categories' }, { status: 500 });
  }
}

// POST /api/categories -> create (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;
    if ((auth.user as any)?.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => null) as { name?: string } | null;
    if (!body?.name || !body.name.trim()) return NextResponse.json({ message: 'name is required' }, { status: 400 });

    await dbConnect();
    const name = body.name.trim();
    const exists = await CategoryModel.findOne({ name });
    if (exists) return NextResponse.json({ message: 'Category already exists' }, { status: 409 });

    const cat = await CategoryModel.create({ name });
    return NextResponse.json({ category: cat }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to create category' }, { status: 500 });
  }
}

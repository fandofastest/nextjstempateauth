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
    if (!decoded) return { ok: false, res: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) } as const;
    if (decoded.role !== 'admin') return { ok: false, res: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) } as const;
    return { ok: true, user: decoded } as const;
  }

  const nextAuthToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!nextAuthToken) return { ok: false, res: NextResponse.json({ message: 'No token provided' }, { status: 401 }) } as const;
  if (nextAuthToken.role !== 'admin') return { ok: false, res: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) } as const;
  return { ok: true, user: nextAuthToken } as const;
}

// PUT /api/roles/[id] -> update role
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const { id } = params;
    const payload = await request.json();

    const updated = await Role.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.description !== undefined ? { description: payload.description } : {}),
          ...(payload.permissions !== undefined ? { permissions: Array.isArray(payload.permissions) ? payload.permissions : [] } : {}),
        },
      },
      { new: true }
    );

    if (!updated) return NextResponse.json({ message: 'Role not found' }, { status: 404 });

    return NextResponse.json({ role: updated });
  } catch (err: any) {
    console.error('PUT /api/roles/[id] error:', err);
    return NextResponse.json({ message: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/roles/[id] -> delete role
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const { id } = params;

    const deleted = await Role.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: 'Role not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/roles/[id] error:', err);
    return NextResponse.json({ message: 'Failed to delete role' }, { status: 500 });
  }
}

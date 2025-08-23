import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';
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

// GET /api/users/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
    }

    const user = await User.findById(params.id, { passwordHash: 0 });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('GET /api/users/[id] error:', err);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/users/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
    }

    const body = await request.json();
    const update: any = {};

    if (body.name) update.name = body.name;
    if (body.email) update.email = body.email;
    if (body.role && ['customer', 'admin'].includes(body.role)) update.role = body.role;
    if (body.password) update.passwordHash = body.password; // will be hashed by pre-save on save(), but findByIdAndUpdate bypasses hooks

    let user;
    if (update.passwordHash) {
      // Use doc.save() to trigger pre-save hook for hashing
      user = await User.findById(params.id);
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
      if (update.name) user.name = update.name;
      if (update.email) user.email = update.email;
      if (update.role) user.role = update.role;
      if (update.passwordHash) user.passwordHash = update.passwordHash;
      await user.save();
    } else {
      user = await User.findByIdAndUpdate(
        params.id,
        { $set: update },
        { new: true, runValidators: true, projection: { passwordHash: 0 } }
      );
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return NextResponse.json({ user: userWithoutPassword });
  } catch (err: any) {
    console.error('PUT /api/users/[id] error:', err);
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
    }

    const user = await User.findByIdAndDelete(params.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/users/[id] error:', err);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

async function requireUser(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (bearer) {
    const decoded = verifyToken(bearer);
    if (!decoded) return { ok: false, res: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) } as const;
    return { ok: true, user: decoded } as const;
  }
  const nextAuthToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!nextAuthToken) return { ok: false, res: NextResponse.json({ message: 'No token provided' }, { status: 401 }) } as const;
  return { ok: true, user: nextAuthToken } as const;
}

// GET /api/me -> current user (without password)
export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();
    const id = (auth.user as any)?.id || (auth.user as any)?._id;
    const user = await User.findById(id, { passwordHash: 0 });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH /api/me -> update current user (name or password change)
export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;
    await dbConnect();

    const id = (auth.user as any)?.id || (auth.user as any)?._id;
    const body = await request.json().catch(() => ({}));

    const update: any = {};
    if (typeof body.name === 'string' && body.name.trim()) {
      update.name = body.name.trim();
    }

    // For password change, require { currentPassword, newPassword }
    const wantsPasswordChange = body.currentPassword && body.newPassword;

    if (wantsPasswordChange) {
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
      const ok = await user.comparePassword(String(body.currentPassword));
      if (!ok) return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
      user.passwordHash = String(body.newPassword);
      if (update.name) user.name = update.name;
      await user.save();
      const { passwordHash, ...u } = user.toObject();
      return NextResponse.json({ user: u });
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true, projection: { passwordHash: 0 } }
    );
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}

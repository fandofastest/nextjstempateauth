import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

// Helper to check admin from Authorization header
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

  // Fallback: NextAuth token from cookies
  const nextAuthToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!nextAuthToken) return { ok: false, res: NextResponse.json({ message: 'No token provided' }, { status: 401 }) } as const;
  if (nextAuthToken.role !== 'admin') return { ok: false, res: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) } as const;
  return { ok: true, user: nextAuthToken } as const;
}

// GET /api/users -> list users (admin only)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users -> create user (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const { name, email, phone, password, role = 'customer' } = await request.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ message: 'Name, email, phone, and password are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Please provide a valid email address' }, { status: 400 });
    }

    // Normalize phone: strip spaces/dashes; if starts with 0 -> +62 + rest; then validate E.164-like
    const rawPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    const normalizedPhone = rawPhone.startsWith('0') ? '+62' + rawPhone.slice(1) : rawPhone;
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json({ message: 'Please provide a valid phone number (e.g., +628123456789 or 08xxxx which will be normalized)' }, { status: 400 });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone: normalizedPhone }] });
    if (existing) {
      return NextResponse.json({ message: existing.email === email ? 'Email already in use' : 'Phone already in use' }, { status: 409 });
    }

    const user = new User({
      name,
      email,
      phone: normalizedPhone,
      passwordHash: password, // hashed by pre-save hook
      role: ['customer', 'admin'].includes(role) ? role : 'customer',
    });

    await user.save();

    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/users error:', err);
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}

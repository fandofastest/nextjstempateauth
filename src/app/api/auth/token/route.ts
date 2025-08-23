import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { generateToken, verifyToken } from '@/lib/auth';
import { getToken as getNextAuthToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // 1) If Authorization: Bearer present, verify and re-issue
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const bearer = authHeader.split(' ')[1];
      const decoded = verifyToken(bearer);
      if (!decoded) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
      }
      const user = await User.findById(decoded.id);
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
      const token = generateToken(user);
      return NextResponse.json({ token });
    }

    // 2) Else, try NextAuth session cookie
    const sessionToken = await getNextAuthToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!sessionToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // We expect email in NextAuth token
    const email = (sessionToken as any).email as string | undefined;
    if (!email) {
      return NextResponse.json({ message: 'Session missing email' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const token = generateToken(user);
    return NextResponse.json({ token });
  } catch (err: any) {
    console.error('POST /api/auth/token error:', err);
    return NextResponse.json({ message: 'Failed to issue token' }, { status: 500 });
  }
}

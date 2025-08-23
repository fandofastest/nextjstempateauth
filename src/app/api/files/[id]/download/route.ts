import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FileModel from '@/models/File';
import { verifyToken } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';
import fs from 'fs';

async function requireUser(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      return { ok: true, user: decoded } as const;
    }
    // Bearer provided but invalid; attempt fallback to NextAuth cookie session
    const nextAuthTokenFromBearerFail = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!nextAuthTokenFromBearerFail) return { ok: false, res: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) } as const;
    return { ok: true, user: nextAuthTokenFromBearerFail } as const;
  }
  const nextAuthToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!nextAuthToken) return { ok: false, res: NextResponse.json({ message: 'No token provided' }, { status: 401 }) } as const;
  return { ok: true, user: nextAuthToken } as const;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();
    const file = await FileModel.findById(params.id);
    if (!file) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const isAdmin = (auth.user as any)?.role === 'admin';
    const isOwner = String(file.uploader) === String((auth.user as any)?.id || (auth.user as any)?._id);
    // Allow if admin, owner, or file is public
    if (!isAdmin && !isOwner && !file.isPublic) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const stream = fs.createReadStream(file.storagePath);
    const res = new Response(stream as any, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
    return res;
  } catch (err) {
    return NextResponse.json({ message: 'Failed to download' }, { status: 500 });
  }
}

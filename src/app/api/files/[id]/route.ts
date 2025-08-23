import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FileModel from '@/models/File';
import CategoryModel from '@/models/Category';
import { verifyToken } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';
import fs from 'fs/promises';

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

// GET /api/files/[id] -> metadata
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();
    const file = await FileModel.findById(params.id);
    if (!file) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    // Visibility rules: admin can view any; public visible to all; otherwise only owner
    const isAdmin = (auth.user as any)?.role === 'admin';
    const isOwner = String(file.uploader) === String((auth.user as any)?.id || (auth.user as any)?._id);
    if (!isAdmin && !file.isPublic && !isOwner) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ file });
  } catch (err) {
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}

// DELETE /api/files/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();
    const file = await FileModel.findById(params.id);
    if (!file) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const isAdmin = (auth.user as any)?.role === 'admin';
    const isOwner = String(file.uploader) === String((auth.user as any)?.id || (auth.user as any)?._id);
    if (!isAdmin && !isOwner) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // remove physical file
    try { await fs.unlink(file.storagePath); } catch {}
    await FileModel.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
  }
}

// PATCH /api/files/[id] -> update metadata (category, isPublic)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();
    const file = await FileModel.findById(params.id);
    if (!file) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const isAdmin = (auth.user as any)?.role === 'admin';
    const isOwner = String(file.uploader) === String((auth.user as any)?.id || (auth.user as any)?._id);
    if (!isAdmin && !isOwner) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => null);
    // accept either { category, isPublic } or { file: { category, isPublic } }
    let incomingCategory = body ? (typeof body.category !== 'undefined' ? body.category : body?.file?.category) : undefined as any;
    let incomingIsPublic = body ? (typeof body.isPublic !== 'undefined' ? body.isPublic : body?.file?.isPublic) : undefined as any;
    if (typeof incomingCategory === 'string') incomingCategory = incomingCategory.trim();
    if (typeof incomingIsPublic !== 'undefined') incomingIsPublic = Boolean(incomingIsPublic);

    if (typeof incomingCategory !== 'undefined' && incomingCategory) {
      const exists = await CategoryModel.findOne({ name: incomingCategory });
      if (!exists) return NextResponse.json({ message: 'Category not found' }, { status: 400 });
    }
    const update: any = {};
    if (typeof incomingCategory !== 'undefined') {
      if (incomingCategory === '') {
        update.$unset = { ...(update.$unset || {}), category: 1 };
      } else {
        update.$set = { ...(update.$set || {}), category: incomingCategory };
      }
    }
    if (typeof incomingIsPublic !== 'undefined') {
      update.$set = { ...(update.$set || {}), isPublic: Boolean(incomingIsPublic) };
    }
    if (!update.$set && !update.$unset) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
    }
    const updated = await FileModel.findByIdAndUpdate(
      params.id,
      update,
      { new: true, runValidators: true }
    );
    return NextResponse.json({ file: updated });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
  }
}

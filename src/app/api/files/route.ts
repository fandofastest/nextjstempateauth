import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FileModel from '@/models/File';
import CategoryModel from '@/models/Category';
import UserModel from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import crypto from 'crypto';

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

function ensureUploadsDir() {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

// GET /api/files -> list files (admin: all, user: own)
export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 100);
    const q = (url.searchParams.get('q') || '').trim();
    const category = url.searchParams.get('category') || '';
    const startDate = url.searchParams.get('startDate'); // ISO date
    const endDate = url.searchParams.get('endDate'); // ISO date

    const andClauses: any[] = [];
    if (q) {
      const regex = new RegExp(q, 'i');
      // try to match uploader by name/email/phone
      let uploaderMatchIds: any[] = [];
      try {
        const matchedUsers = await UserModel.find({
          $or: [
            { name: { $regex: regex } },
            { email: { $regex: regex } },
            { phone: { $regex: regex } },
          ],
        }).select('_id');
        uploaderMatchIds = matchedUsers.map((u: any) => u._id);
      } catch {}

      const searchOr: any[] = [
        { originalName: { $regex: regex } },
        { mimeType: { $regex: regex } },
        { description: { $regex: regex } },
      ];
      if (uploaderMatchIds.length) {
        searchOr.push({ uploader: { $in: uploaderMatchIds } });
      }
      andClauses.push({ $or: searchOr });
    }

    if (category) {
      andClauses.push({ category });
    }

    if (startDate || endDate) {
      const createdAt: any = {};
      if (startDate) createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) createdAt.$lte = end;
      }
      if (Object.keys(createdAt).length > 0) andClauses.push({ createdAt });
    }

    // if not admin, list own files OR public files
    if (auth.user?.role !== 'admin') {
      const uid = (auth.user as any)?.id || (auth.user as any)?._id;
      andClauses.push({ $or: [{ uploader: uid }, { isPublic: true }] });
    }

    const filter: any = andClauses.length ? { $and: andClauses } : {};

    const total = await FileModel.countDocuments(filter);
    const files = await FileModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('uploader', 'name email phone');

    return NextResponse.json({ files, page, pageSize, total });
  } catch (err: any) {
    console.error('GET /api/files error:', err);
    return NextResponse.json({ message: 'Failed to fetch files' }, { status: 500 });
  }
}

// POST /api/files -> upload file (admin & user)
export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.res as NextResponse;

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file') as unknown as File | null;
    const category = (formData.get('category') as string) || undefined;
    const phoneRaw = formData.get('phone');
    const phone = typeof phoneRaw === 'string' ? phoneRaw.trim() : undefined;
    const descriptionRaw = formData.get('description');
    const description = typeof descriptionRaw === 'string' ? descriptionRaw : undefined;
    const isPublicRaw = formData.get('isPublic');
    const isPublic = typeof isPublicRaw === 'string' ? (isPublicRaw === 'true' || isPublicRaw === '1' || isPublicRaw === 'on') : false;
    if (!file) return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });

    // size limit from config/env
    const maxMb = parseInt(process.env.NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB || process.env.UPLOAD_MAX_SIZE_MB || '50');
    const sizeLimit = maxMb * 1024 * 1024;
    if (file.size > sizeLimit) {
      return NextResponse.json({ message: `File too large. Max ${maxMb}MB` }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = ensureUploadsDir();
    const ext = path.extname(file.name);
    const storedName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const destPath = path.join(uploadDir, storedName);

    await fs.writeFile(destPath, buffer);

    // validate category if provided
    if (category) {
      const exists = await CategoryModel.findOne({ name: category });
      if (!exists) return NextResponse.json({ message: 'Category not found' }, { status: 400 });
    }

    // determine uploader: by phone (if provided) else current user
    let uploaderId = (auth.user as any)?.id || (auth.user as any)?._id;
    if (phone) {
      const user = await UserModel.findOne({ phone });
      if (user) uploaderId = user._id;
    }

    const doc = await FileModel.create({
      originalName: file.name,
      storedName,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      storagePath: destPath,
      uploader: uploaderId,
      category,
      description,
      isPublic,
    });

    return NextResponse.json({ file: doc }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/files error:', err);
    return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 });
  }
}

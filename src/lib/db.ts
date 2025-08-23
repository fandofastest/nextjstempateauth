import mongoose from 'mongoose';
import User from '@/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lapfutsal';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

interface ICachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: ICachedMongoose;
}

let cached: ICachedMongoose = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  // Ensure super admin exists only once after the first successful connection
  await ensureSuperAdmin();

  return cached.conn;
}

export default dbConnect;

// Helper: create a superadmin if none exists
let superAdminChecked = false;
async function ensureSuperAdmin() {
  try {
    if (superAdminChecked) return; // idempotent guard per runtime

    const hasAdmin = await User.exists({ role: 'admin' });
    if (hasAdmin) {
      superAdminChecked = true;
      return;
    }

    const name = process.env.ADMIN_NAME || 'Super Admin';
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn('[INIT] No admin exists, but ADMIN_EMAIL/ADMIN_PASSWORD are not set. Skipping auto-create.');
      superAdminChecked = true;
      return;
    }

    const existingWithEmail = await User.findOne({ email });
    if (existingWithEmail) {
      console.log('[INIT] Admin email already present, skipping admin creation.');
      superAdminChecked = true;
      return;
    }

    const adminUser = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      role: 'admin',
    });
    await adminUser.save();
    console.log('[INIT] Superadmin created:', { email });

    superAdminChecked = true;
  } catch (err) {
    console.error('[INIT] Failed to ensure superadmin:', err);
    // Do not throw to avoid breaking the app startup
  }
}

import { NextResponse } from 'next/server';

// Since tokens are stored client-side (localStorage) in current setup,
// server-side logout is effectively a no-op. We just respond OK so the
// client can clear its local token and redirect.
export async function POST() {
  return NextResponse.json({ message: 'Logged out' });
}

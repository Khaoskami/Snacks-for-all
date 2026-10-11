import { NextResponse } from 'next/server';
import { getAccess } from '@/lib/access';
import { getAdminStatus } from '@/lib/admin-status';

export async function GET() {
  const access = await getAccess();
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!access.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  if (!access.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
  return NextResponse.json(await getAdminStatus(), { headers });
}

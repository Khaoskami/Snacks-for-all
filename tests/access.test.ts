import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAdminUser } from '../src/lib/admin-policy';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), currentUser: vi.fn(), status: vi.fn() }));
vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth, currentUser: mocks.currentUser }));
vi.mock('@/lib/admin-status', () => ({ getAdminStatus: mocks.status }));
vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NOT_FOUND'); },
  redirect: () => { throw new Error('REDIRECT'); },
}));
import { GET } from '../src/app/api/admin/status/route';
import AdminPage from '../src/app/admin/page';
const user = (email: string, status = 'verified', id = 'user_1') => ({ id, primaryEmailAddress: { emailAddress: email, verification: { status } } });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: 'user_1' });
  mocks.currentUser.mockResolvedValue(user('ordinary@example.com'));
  mocks.status.mockResolvedValue({ databaseAvailable: true });
});
describe('admin identity and direct route access', () => {
  it.each(['asadtitus@gmail.com', 'ASADTITUS@GMAIL.COM'])('allows the verified exact email %s', email => {
    expect(isAdminUser(user(email))).toBe(true);
  });
  it.each(['ordinary@example.com', 'asadtitus+admin@gmail.com', 'asadtitus@gmail.com.attacker.test'])('rejects %s', email => {
    expect(isAdminUser(user(email))).toBe(false);
  });
  it('rejects missing, unverified and metadata-only admin claims', () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(user('asadtitus@gmail.com', 'unverified'))).toBe(false);
    expect(isAdminUser({ ...user('ordinary@example.com'), ...{ publicMetadata: { role: 'admin' } } })).toBe(false);
  });
  it('returns 401 before reading admin data for anonymous requests', async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    expect((await GET()).status).toBe(401);
    expect(mocks.currentUser).not.toHaveBeenCalled();
    expect(mocks.status).not.toHaveBeenCalled();
  });
  it('returns 403 for regular users even via direct API access', async () => {
    const response = await GET();
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.status).not.toHaveBeenCalled();
  });
  it('rejects unverified admin and mismatched session identity', async () => {
    mocks.currentUser.mockResolvedValue(user('asadtitus@gmail.com', 'unverified'));
    expect((await GET()).status).toBe(403);
    mocks.currentUser.mockResolvedValue(user('asadtitus@gmail.com', 'verified', 'other_user'));
    expect((await GET()).status).toBe(403);
    expect(mocks.status).not.toHaveBeenCalled();
  });
  it('serves diagnostics to the verified admin', async () => {
    mocks.currentUser.mockResolvedValue(user('asadtitus@gmail.com'));
    expect((await GET()).status).toBe(200);
    expect(mocks.status).toHaveBeenCalledOnce();
  });
  it('does not render or fetch admin data for a direct page visit by a user', async () => {
    await expect(AdminPage()).rejects.toThrow('NOT_FOUND');
    expect(mocks.status).not.toHaveBeenCalled();
  });
  it('redirects signed-out admin page visits before loading data', async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    await expect(AdminPage()).rejects.toThrow('REDIRECT');
    expect(mocks.status).not.toHaveBeenCalled();
  });
});

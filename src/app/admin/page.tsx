import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAccess } from '@/lib/access';
import { getAdminStatus } from '@/lib/admin-status';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const access = await getAccess();
  if (!access.userId) redirect('/sign-in?redirect_url=/admin');
  if (!access.isAdmin) notFound();
  const status = await getAdminStatus();
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/account" className="text-orange-600">← My account</Link>
      <h1 className="text-4xl font-bold mt-5">Admin dashboard</h1>
      <p className="mt-3 text-slate-500">Service status and deployment setup. Only the verified administrator can access this page.</p>
      <div className="mt-8 rounded-3xl border bg-white p-6 space-y-4">
        <p>Database: <strong>{status.databaseAvailable ? 'Connected' : 'Unavailable — check DATABASE_URL and database schema in Railway.'}</strong></p>
        <p>Clerk keys: {status.configuration.clerk ? 'Configured' : 'Missing'}</p>
        <p>Recipe provider: TheMealDB ({status.configuration.recipeKey} key)</p>
        <p>Donations: {status.configuration.donations}</p>
        <p>Order requests: {status.configuration.orders ? 'Configured' : 'Add NEXT_PUBLIC_ORDER_EMAIL in Railway.'}</p>
      </div>
      <p className="text-sm text-slate-500 mt-6">Bank transfer details are displayed publicly on the donation page. Payments are made through the donor’s bank and are not automatically confirmed by this website.</p>
    </main>
  );
}

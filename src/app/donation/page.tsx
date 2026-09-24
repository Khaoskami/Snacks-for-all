import Link from 'next/link';

export default function DonationPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-center">
      <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
      <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 mt-6">
        <div className="text-5xl">❤</div>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-5">Support Snacks for All</h1>
        <p className="mt-4 text-slate-500">This is the donation section. Connect your chosen payment provider here when donations are ready to be enabled.</p>
        <p className="mt-6 text-sm text-slate-400">No payment functionality is claimed until a provider is connected.</p>
      </div>
    </main>
  );
}

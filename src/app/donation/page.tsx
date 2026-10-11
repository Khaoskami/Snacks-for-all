import Link from 'next/link';
import BankDetails from './BankDetails';

export default function DonationPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-center">
      <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-12 mt-6">
        <div aria-hidden="true" className="text-5xl">❤</div>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-5">Support Snacks for All</h1>
        <p className="mt-4 text-slate-500">Help keep the recipe and food tools running. Every contribution is appreciated.</p>
        <BankDetails />
      </div>
    </main>
  );
}

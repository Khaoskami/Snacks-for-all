import Link from 'next/link';

export default function ShopPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
      <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 mt-6 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-5">Food Ordering</h1>
        <p className="mt-4 text-slate-500">This section is reserved for food ordering and shopping. Products, suppliers and checkout can be added without changing the recipe experience.</p>
        <div className="mt-8 p-5 rounded-2xl bg-slate-50 text-left">
          <p className="font-semibold text-slate-800">Planned flow</p>
          <p className="mt-2 text-sm text-slate-500">Choose food → add to basket → review order → checkout.</p>
        </div>
      </div>
    </main>
  );
}

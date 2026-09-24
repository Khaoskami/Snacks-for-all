import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-[#faf9f6] text-slate-800">
      <section className="max-w-6xl mx-auto px-6 py-10 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500 mb-3">Snacks for All</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Good food, made easier.
          </h1>
          <p className="mt-5 text-lg text-slate-500">
            Find recipes from the ingredients you already have, discover food to order, or support the project.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/donation" className="min-h-56 rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
            <span className="text-5xl">❤</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Support</h2>
              <p className="mt-2 text-slate-500">Visit the donation section and support Snacks for All.</p>
            </div>
          </Link>

          <Link href="/recipes" className="min-h-56 rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
            <span className="text-5xl">🍲</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recipes</h2>
              <p className="mt-2 text-slate-500">Search ingredients and find recipes that use them.</p>
            </div>
          </Link>

          <Link href="/shop" className="min-h-56 rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between">
            <span className="text-5xl">🛒</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Food Ordering</h2>
              <p className="mt-2 text-slate-500">Go to the food ordering and shopping section.</p>
            </div>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/recipes" className="px-5 py-3 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">
            Find a recipe
          </Link>
          {userId ? (
            <Link href="/account" className="px-5 py-3 rounded-full bg-white border border-slate-200 font-semibold hover:border-orange-300 transition-colors">
              My account
            </Link>
          ) : (
            <Link href="/sign-in" className="px-5 py-3 rounded-full bg-white border border-slate-200 font-semibold hover:border-orange-300 transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

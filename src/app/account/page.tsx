import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Sign in to view your account</h1>
        <Link href="/sign-in" className="inline-block mt-6 px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold">Sign in</Link>
      </main>
    );
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-5xl mx-auto px-6 pb-20">
      <div className="py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-5">My account</h1>
        <p className="mt-2 text-slate-500">Recipes you have added.</p>
      </div>

      <div className="flex justify-end mb-6">
        <Link href="/upload" className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold">Add recipe</Link>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <p className="text-slate-500">You have not added any recipes yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {recipes.map((recipe) => (
            <article key={recipe.id} className="bg-white border border-slate-200 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-slate-900">{recipe.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{recipe.ingredients.join(', ')}</p>
              <p className="mt-4 text-sm text-slate-600 whitespace-pre-line">{recipe.instructions}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

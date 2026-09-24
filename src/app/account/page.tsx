import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { DeleteRecipeButton } from './RecipeActions';

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

  const [recipes, savedRecipes] = await Promise.all([
    prisma.recipe.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.savedRecipe.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-6 pb-20">
      <div className="py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-5">My account</h1>
        <p className="mt-2 text-slate-500">Manage recipes you created and recipes you saved.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/upload" className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">Add recipe</Link>
        <Link href="/recipes" className="px-5 py-3 rounded-xl bg-white border border-slate-200 font-semibold hover:border-orange-300">Find recipes</Link>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">My recipes</h2>
        {recipes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <p className="text-slate-500">You have not added any recipes yet.</p>
            <Link href="/upload" className="inline-block mt-5 text-orange-600 font-semibold">Add your first recipe →</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {recipes.map((recipe) => (
              <article key={recipe.id} className="bg-white border border-slate-200 rounded-3xl p-6">
                <div className="flex justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-900">{recipe.title}</h3>
                  <DeleteRecipeButton id={recipe.id} />
                </div>
                <p className="mt-2 text-sm text-slate-500">{recipe.ingredients.join(', ')}</p>
                <p className="mt-4 text-sm text-slate-600 whitespace-pre-line">{recipe.instructions}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Saved recipes</h2>
        {savedRecipes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">Save recipes from the search results and they will appear here.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {savedRecipes.map((recipe) => (
              <article key={recipe.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover" />}
                <div className="p-6 flex justify-between gap-4 items-center">
                  <h3 className="font-bold text-slate-900">{recipe.title}</h3>
                  <DeleteRecipeButton id={recipe.id} saved />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

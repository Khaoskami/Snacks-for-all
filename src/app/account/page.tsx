import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { DeleteRecipeButton } from './RecipeActions';

function externalRecipeUrl(externalId: string) {
  if (externalId.startsWith('mealdb-')) {
    const mealId = externalId.replace('mealdb-', '');
    return `https://www.themealdb.com/meal.php?c=${encodeURIComponent(mealId)}`;
  }
  return null;
}

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Sign in to view your account</h1>
        <p className="mt-3 text-slate-500">Your account is where your recipes and saved recipes live.</p>
        <Link href="/sign-in?redirect_url=/account" className="inline-block mt-6 px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold">Sign in</Link>
      </main>
    );
  }

  const user = await currentUser();
  let recipes = [] as Awaited<ReturnType<typeof prisma.recipe.findMany>>;
  let savedRecipes = [] as Awaited<ReturnType<typeof prisma.savedRecipe.findMany>>;
  let databaseError = '';

  try {
    [recipes, savedRecipes] = await Promise.all([
      prisma.recipe.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.savedRecipe.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);
  } catch (error) {
    console.error('Account load error:', error);
    databaseError = 'Your account is connected, but the recipe database is currently unavailable. Check DATABASE_URL in Railway.';
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Food lover';
  const email = user?.primaryEmailAddress?.emailAddress || 'No email address available';

  return (
    <main className="max-w-6xl mx-auto px-6 pb-20">
      <div className="py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
        <div className="mt-5 bg-white border border-slate-200 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-orange-600 font-semibold uppercase tracking-wide">Your account</p>
              <h1 className="text-4xl font-extrabold text-slate-900 mt-2">Welcome, {displayName}</h1>
              <p className="mt-2 text-slate-500">{email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[220px]">
              <div className="rounded-2xl bg-orange-50 p-4"><p className="text-sm text-slate-500">My recipes</p><p className="text-2xl font-bold text-slate-900">{recipes.length}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Saved</p><p className="text-2xl font-bold text-slate-900">{savedRecipes.length}</p></div>
            </div>
          </div>
        </div>
      </div>

      {databaseError && <div className="mb-8 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5">{databaseError}</div>}

      <div className="flex flex-wrap gap-3 mb-10">
        <Link href="/upload" className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">Add recipe</Link>
        <Link href="/recipes" className="px-5 py-3 rounded-xl bg-white border border-slate-200 font-semibold hover:border-orange-300">Find recipes</Link>
        <Link href="/shop" className="px-5 py-3 rounded-xl bg-white border border-slate-200 font-semibold hover:border-orange-300">Shop food</Link>
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
                <div className="flex justify-between gap-4 items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{recipe.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{recipe.ingredients.join(', ')}</p>
                  </div>
                  <DeleteRecipeButton id={recipe.id} />
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-orange-600">View instructions</summary>
                  <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">{recipe.instructions}</p>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Saved recipes</h2>
        {savedRecipes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">Save recipes from the recipe search and they will appear here.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {savedRecipes.map((recipe) => {
              const originalUrl = externalRecipeUrl(recipe.externalId);
              return (
                <article key={recipe.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                  {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover" />}
                  <div className="p-6">
                    <div className="flex justify-between gap-4 items-start">
                      <div>
                        <h3 className="font-bold text-slate-900">{recipe.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">Saved recipe</p>
                      </div>
                      <DeleteRecipeButton id={recipe.id} saved />
                    </div>
                    {originalUrl && <a href={originalUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700">Open recipe ↗</a>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

 "use client";

import { useState } from 'react';
import Link from 'next/link';

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  image?: string | null;
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchRecipes = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/recipes?ingredients=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      setRecipes(await res.json());
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 pb-20">
      <div className="max-w-3xl mx-auto text-center py-8 md:py-12">
        <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-5">Find a recipe</h1>
        <p className="mt-3 text-slate-500">Search for one or more ingredients you have available.</p>

        <form onSubmit={searchRecipes} className="mt-8 flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. chicken, garlic"
            className="min-w-0 flex-1 px-4 py-3 rounded-xl outline-none"
            aria-label="Search ingredients"
          />
          <button disabled={loading} className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-50">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>

      {loading && <p className="text-center text-slate-500 py-10">Finding recipes…</p>}

      {!loading && recipes.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <article key={recipe.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              {recipe.image ? (
                <img src={recipe.image} alt="" className="w-full h-52 object-cover" />
              ) : (
                <div className="h-52 bg-orange-50 flex items-center justify-center text-5xl">🍲</div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900">{recipe.title}</h2>
                <div className="flex flex-wrap gap-2 mt-4">
                  {recipe.ingredients.slice(0, 8).map((ingredient, index) => (
                    <span key={`${ingredient}-${index}`} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                      {ingredient}
                    </span>
                  ))}
                </div>
                <details className="mt-5">
                  <summary className="cursor-pointer font-semibold text-orange-600">View instructions</summary>
                  <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">{recipe.instructions}</p>
                </details>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasSearched && !loading && recipes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <p className="text-3xl">🍳</p>
          <h2 className="mt-3 text-xl font-bold">No recipes found</h2>
          <p className="mt-2 text-slate-500">Try another ingredient or combination.</p>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12 text-slate-400">Start with an ingredient you already have.</div>
      )}
    </main>
  );
}

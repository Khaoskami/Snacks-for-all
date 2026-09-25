"use client";

import { useState } from 'react';
import Link from 'next/link';
import RecipeCard from './RecipeCard';

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  image?: string | null;
  source?: string;
  sourceUrl?: string;
  savable?: boolean;
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async (query: string, event?: React.FormEvent) => {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setHasSearched(true);
    setError('');

    try {
      const res = await fetch(`/api/recipes?q=${encodeURIComponent(cleanQuery)}`);
      if (!res.ok) throw new Error('Search failed');
      setRecipes(await res.json());
    } catch {
      setRecipes([]);
      setError('Recipe search is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const randomRecipe = async () => {
    setLoading(true);
    setHasSearched(true);
    setError('');
    setSearch('');

    try {
      const res = await fetch('/api/recipes?random=1');
      if (!res.ok) throw new Error('Random recipe failed');
      setRecipes(await res.json());
    } catch {
      setRecipes([]);
      setError('Could not load a recipe right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 pb-20">
      <div className="max-w-3xl mx-auto text-center py-8 md:py-12">
        <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-5">Find a recipe</h1>
        <p className="mt-3 text-slate-500">Search by recipe name, ingredient, or a combination of ingredients.</p>

        <form onSubmit={(event) => runSearch(search, event)} className="mt-8 flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. lasagne, chicken, garlic"
            className="min-w-0 flex-1 px-4 py-3 rounded-xl outline-none"
            aria-label="Search recipes or ingredients"
          />
          <button type="submit" disabled={loading || !search.trim()} className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-50">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['chicken', 'pasta', 'breakfast'].map((term) => (
            <button key={term} type="button" onClick={() => { setSearch(term); void runSearch(term); }} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-600 hover:border-orange-300 hover:text-orange-600">
              {term}
            </button>
          ))}
          <button type="button" onClick={randomRecipe} className="px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-sm text-orange-700 hover:bg-orange-100">
            Surprise me
          </button>
        </div>
      </div>

      {error && <p className="text-center text-red-600 py-4">{error}</p>}
      {loading && <p className="text-center text-slate-500 py-10">Finding recipes…</p>}

      {!loading && recipes.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      )}

      {hasSearched && !loading && recipes.length === 0 && !error && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <p className="text-3xl">🍳</p>
          <h2 className="mt-3 text-xl font-bold">No recipes found</h2>
          <p className="mt-2 text-slate-500">Try a recipe name, one ingredient, or a simpler search.</p>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12 text-slate-400">Search general recipes or start with ingredients you already have.</div>
      )}

      <div className="mt-10 text-center">
        <Link href="/upload" className="inline-block px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">Add your own recipe</Link>
      </div>
    </main>
  );
}

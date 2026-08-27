"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadRecipe() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const ingredientsRaw = formData.get('ingredients') as string;
    const instructions = formData.get('instructions') as string;

    // Sanitize and split the raw string into the array format Prisma demands
    const ingredients = ingredientsRaw.split(',').map(i => i.trim()).filter(Boolean);

    if (ingredients.length === 0) {
      setError('You must provide at least one ingredient.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ingredients, instructions }),
      });

      if (!res.ok) {
        throw new Error('Failed to save the recipe.');
      }

      // Route back to the home page and force a server refresh to update state
      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Server error during upload. Check your Railway logs.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf9f6] text-slate-800 font-sans p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-orange-500 mb-8 inline-block transition-colors">
          ← Back to Search
        </Link>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Upload a Recipe</h1>
          <p className="text-slate-500 mb-8 font-medium">Save your custom meals to your personal vault.</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">Recipe Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="e.g. Grandma's Garlic Chicken"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all"
              />
            </div>

            <div>
              <label htmlFor="ingredients" className="block text-sm font-bold text-slate-700 mb-2">Ingredients (Comma separated)</label>
              <input
                type="text"
                id="ingredients"
                name="ingredients"
                required
                placeholder="e.g. Chicken breast, Garlic, Olive oil, Salt"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all"
              />
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-bold text-slate-700 mb-2">Instructions</label>
              <textarea
                id="instructions"
                name="instructions"
                required
                rows={6}
                placeholder="Step 1: Preheat oven to 400 degrees..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving to Vault...' : 'Save Recipe'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
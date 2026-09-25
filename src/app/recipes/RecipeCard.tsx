"use client";

import { useState } from 'react';

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

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const saveRecipe = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/saved-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalId: recipe.id, title: recipe.title, image: recipe.image }),
      });
      if (response.status === 401) {
        window.location.href = '/sign-in?redirect_url=/recipes';
        return;
      }
      if (!response.ok) throw new Error();
      setSaved(true);
      setMessage('Saved to your account.');
    } catch {
      setMessage('Could not save this recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {recipe.image ? <img src={recipe.image} alt={recipe.title} className="w-full h-52 object-cover" /> : <div className="h-52 bg-orange-50 flex items-center justify-center text-5xl">🍲</div>}
      <div className="p-6">
        <div className="flex justify-between gap-4 items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{recipe.title}</h2>
            {recipe.source && <p className="text-xs text-slate-400 mt-1">Source: {recipe.source}</p>}
          </div>
          {recipe.savable && (
            <button type="button" onClick={saveRecipe} disabled={saving || saved} className="shrink-0 px-3 py-2 rounded-xl border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-50 disabled:opacity-50">
              {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {recipe.ingredients.slice(0, 8).map((ingredient, index) => <span key={`${ingredient}-${index}`} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">{ingredient}</span>)}
        </div>

        <details className="mt-5">
          <summary className="cursor-pointer font-semibold text-orange-600">View instructions</summary>
          <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">{recipe.instructions}</p>
        </details>

        {recipe.sourceUrl && (
          <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="inline-block mt-5 text-sm font-semibold text-orange-600 hover:text-orange-700">
            Open original recipe ↗
          </a>
        )}

        {message && <p className="mt-3 text-xs text-slate-500">{message}</p>}
      </div>
    </article>
  );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteRecipeButton({ id, saved = false }: { id: string; saved?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    if (!window.confirm(saved ? 'Remove this saved recipe?' : 'Delete this recipe?')) return;
    setLoading(true);
    try {
      const response = await fetch(saved ? '/api/saved-recipes' : '/api/recipes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      window.alert('Could not remove the recipe. Please try again.');
      setLoading(false);
    }
  };

  return <button type="button" onClick={remove} disabled={loading} className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50">{loading ? 'Removing…' : saved ? 'Remove saved' : 'Delete'}</button>;
}

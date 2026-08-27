"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Recipe = { 
  id: string; 
  title: string; 
  ingredients: string[]; 
  instructions: string;
  image?: string; 
};

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRecipes = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes${query ? `?ingredients=${query}` : ''}`);
      const data = await res.json();
      setRecipes(data);
    } catch (error) {
      console.error("Failed to fetch recipes", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRecipes(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes(search);
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recipe Vault</h1>
        <Link href="/upload" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
          Upload New
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2 text-black">
        <input 
          type="text" 
          placeholder="Search by ingredient (e.g. chicken, garlic)" 
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="border rounded-lg overflow-hidden bg-white shadow-sm text-black flex flex-col">
            {recipe.image && (
              <img 
                src={recipe.image} 
                alt={recipe.title} 
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold line-clamp-1">{recipe.title}</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                <strong>Ingredients:</strong> {recipe.ingredients.join(', ')}
              </p>
              
              {/* Spacer pushes the button to the bottom */}
              <div className="mt-auto pt-4 border-t">
                 <a 
                  href={`/api/recipes/${recipe.id}/download`} 
                  className="text-sm text-center block w-full bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition"
                >
                  Download Recipe (.md)
                </a>
              </div>
            </div>
          </div>
        ))}
        
        {!loading && recipes.length === 0 && (
          <p className="text-gray-500 col-span-2 text-center py-8">No recipes found. Try a different ingredient!</p>
        )}
      </div>
    </main>
  );
}
"use client";
import { useState } from 'react';
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
  const [hasSearched, setHasSearched] = useState(false);

  const fetchRecipes = async (query = '') => {
    if (!query) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/recipes?ingredients=${query}`);
      const data = await res.json();
      setRecipes(data || []);
    } catch (error) {
      setRecipes([]);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes(search);
  };

  const handlePrint = (recipe: Recipe) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print or save recipes.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${recipe.title} - Delicious AI</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
            h1 { color: #f97316; font-size: 2.5rem; margin-bottom: 1rem; }
            h2 { color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; margin-top: 2rem; }
            .ingredients { background: #fff7ed; padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; }
            ul { margin: 0; padding-left: 1.5rem; }
            li { margin-bottom: 0.5rem; }
            .instructions { white-space: pre-wrap; }
            @media print {
              body { padding: 0; max-width: 100%; }
              /* Force browsers to print the background color of the ingredients box */
              .ingredients { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>${recipe.title}</h1>
          <div class="ingredients">
            <h2>Ingredients</h2>
            <ul>
              ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>
          </div>
          <h2>Instructions</h2>
          <div class="instructions">${recipe.instructions}</div>
          <script>
            window.onload = () => { 
              window.print(); 
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <main className="min-h-screen bg-[#faf9f6] text-slate-800 font-sans selection:bg-orange-200 pb-20">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
              Delicious <span className="text-orange-500">AI</span>
            </h1>
            <p className="text-slate-500 font-medium">Find the perfect meal based on what's in your fridge.</p>
          </div>
          <Link href="/upload" className="bg-orange-500 text-white px-6 py-3 rounded-full font-medium hover:bg-orange-600 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
            + Add Custom Recipe
          </Link>
        </header>

        {/* Floating Search Bar */}
        <form onSubmit={handleSearch} className="mb-16 max-w-2xl mx-auto relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input 
            type="text" 
            placeholder="What ingredients do you have? (e.g. chicken, garlic)" 
            className="w-full p-4 pl-12 pr-32 bg-white border border-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all text-lg"
            onChange={(e) => setSearch(e.target.value)}
            required
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 bg-orange-500 text-white px-6 rounded-full font-medium hover:bg-orange-600 transition-colors shadow-sm">
            {loading ? 'Cooking...' : 'Search'}
          </button>
        </form>

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map(recipe => (
              <div key={recipe.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col group">
                {recipe.image ? (
                  <div className="relative h-56 overflow-hidden">
                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ) : (
                  <div className="h-56 bg-orange-50 flex items-center justify-center">
                    <span className="text-orange-300 font-medium text-4xl">🍲</span>
                  </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 line-clamp-1 group-hover:text-orange-500 transition-colors">{recipe.title}</h2>
                  
                  <div className="flex flex-wrap gap-2 mb-6 h-16 overflow-hidden">
                    {recipe.ingredients.slice(0, 5).map((ing, i) => (
                      <span key={i} className="bg-orange-50 text-orange-700 text-xs px-3 py-1.5 rounded-lg font-medium border border-orange-100/50">
                        {ing}
                      </span>
                    ))}
                    {recipe.ingredients.length > 5 && (
                       <span className="text-xs text-slate-400 py-1.5 font-medium">+{recipe.ingredients.length - 5} more</span>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => handlePrint(recipe)}
                      className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-orange-500 hover:text-white text-slate-600 px-4 py-3 rounded-2xl transition-colors font-medium text-sm border border-slate-100 hover:border-orange-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      Print / Save as PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {hasSearched && !loading && recipes.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto">
            <span className="text-5xl mb-4 block">🍳</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No recipes found</h3>
            <p className="text-slate-500">We couldn't find anything with those ingredients. Try a different combination!</p>
          </div>
        )}
        
        {!hasSearched && recipes.length === 0 && (
          <div className="text-center py-12">
             <p className="text-slate-400 text-lg font-medium">Type an ingredient above to start cooking</p>
          </div>
        )}
      </div>
    </main>
  );
}
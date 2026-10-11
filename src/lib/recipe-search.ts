import 'server-only';

export type RecipeResult = {
  id: string; title: string; ingredients: string[]; instructions: string;
  image: string | null; source: string; sourceUrl: string; savable: boolean;
};
type Meal = { idMeal: string; strMeal: string; [key: string]: string | null | undefined };
type SearchResult = { recipes: RecipeResult[]; warning?: string };
const PARTIAL = 'Some recipe results could not be loaded. Please try again for more results.';
export const normaliseTerm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

function mealToRecipe(meal: Meal): RecipeResult {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (ingredient) ingredients.push([measure, ingredient].filter(Boolean).join(' '));
  }
  return {
    id: `mealdb-${meal.idMeal}`, title: meal.strMeal, ingredients,
    instructions: meal.strInstructions?.trim() || 'See the original recipe for instructions.',
    image: meal.strMealThumb?.startsWith('https://') ? meal.strMealThumb : null,
    source: 'TheMealDB', sourceUrl: `https://www.themealdb.com/meal.php?c=${encodeURIComponent(meal.idMeal)}`,
    savable: true,
  };
}

async function fetchMeals(path: string, signal: AbortSignal, random = false): Promise<Meal[]> {
  const key = encodeURIComponent(process.env.THEMEALDB_API_KEY?.trim() || '1');
  const response = await fetch(`https://www.themealdb.com/api/json/v1/${key}/${path}`, {
    signal,
    ...(random ? { cache: 'no-store' as const } : { next: { revalidate: 600 } }),
  });
  if (!response.ok) throw new Error(`Recipe provider returned HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('meals' in data)) throw new Error('Invalid recipe provider response');
  const meals = data.meals;
  if (meals === null) return [];
  if (!Array.isArray(meals) || meals.some(m => !m || typeof m.idMeal !== 'string' || typeof m.strMeal !== 'string')) {
    throw new Error('Invalid recipe provider response');
  }
  return meals as Meal[];
}

export async function searchRecipes(query: string, random = false): Promise<SearchResult> {
  // One budget shared by discovery and detail requests; requests cannot hang forever.
  const signal = AbortSignal.timeout(10000);
  if (random) {
    const meals = await fetchMeals('random.php', signal, true);
    return { recipes: meals.map(mealToRecipe) };
  }
  const terms = [...new Set(query.split(',').map(normaliseTerm).filter(Boolean))];
  const multi = terms.length > 1;
  const paths = multi
    ? terms.map(term => `filter.php?i=${encodeURIComponent(term.replace(/ /g, '_'))}`)
    : [
      `search.php?s=${encodeURIComponent(query)}`,
      `filter.php?i=${encodeURIComponent(query.replace(/ /g, '_'))}`,
      `filter.php?c=${encodeURIComponent(query)}`,
    ];
  const responses = await Promise.allSettled(paths.map(path => fetchMeals(path, signal)));
  const successful = responses.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  const partial = successful.length !== responses.length;
  // Never return a false "no results" during an outage. Multi searches need every filter.
  if (!successful.length || (multi && partial)) throw new Error('Recipe discovery unavailable');
  const candidates = new Map<string, Meal>();
  for (const meals of successful) for (const meal of meals) {
    if (!multi || successful.every(group => group.some(item => item.idMeal === meal.idMeal))) {
      const previous = candidates.get(meal.idMeal);
      if (!previous || meal.strInstructions) candidates.set(meal.idMeal, meal);
    }
  }
  // Reuse full name-search responses and bound lookup concurrency to four.
  const selected = [...candidates.values()].slice(0, 24);
  const recipes: RecipeResult[] = [];
  let failedDetails = 0;
  for (let offset = 0; offset < selected.length; offset += 4) {
    const batch = await Promise.allSettled(selected.slice(offset, offset + 4).map(async meal => {
      if (typeof meal.strInstructions === 'string') return mealToRecipe(meal);
      const details = await fetchMeals(`lookup.php?i=${encodeURIComponent(meal.idMeal)}`, signal);
      if (!details[0]) throw new Error('Recipe details unavailable');
      return mealToRecipe(details[0]);
    }));
    for (const result of batch) {
      if (result.status === 'fulfilled') recipes.push(result.value);
      else failedDetails++;
    }
  }
  if (selected.length && !recipes.length) throw new Error('Recipe details unavailable');
  return { recipes, ...(partial || failedDetails ? { warning: PARTIAL } : {}) };
}

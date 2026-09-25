import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const THEMEALDB_KEY = process.env.THEMEALDB_API_KEY || '1';
const THEMEALDB_BASE = `https://www.themealdb.com/api/json/v1/${THEMEALDB_KEY}`;

type MealSummary = { idMeal: string };
type Meal = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string | null;
  strInstructions?: string | null;
  [key: string]: string | null | undefined;
};

type RecipeResult = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  image: string | null;
  source: string;
  sourceUrl?: string;
  savable: boolean;
};

function normaliseTerm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mealToRecipe(meal: Meal): RecipeResult {
  const ingredients: string[] = [];

  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`];
    const measure = meal[`strMeasure${index}`];

    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure?.trim() ? `${measure.trim()} ` : ''}${ingredient.trim()}`.trim());
    }
  }

  return {
    id: `mealdb-${meal.idMeal}`,
    title: meal.strMeal,
    ingredients,
    instructions: meal.strInstructions?.trim() || 'See the original recipe for instructions.',
    image: meal.strMealThumb || null,
    source: 'TheMealDB',
    sourceUrl: `https://www.themealdb.com/meal.php?c=${encodeURIComponent(meal.idMeal)}`,
    savable: true,
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, { next: { revalidate: 600 } });
  if (!response.ok) throw new Error(`Recipe API returned ${response.status}`);
  return response.json();
}

async function getMealDetails(id: string): Promise<RecipeResult | null> {
  try {
    const data = await fetchJson(`${THEMEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`);
    const meal = data?.meals?.[0] as Meal | undefined;
    return meal ? mealToRecipe(meal) : null;
  } catch {
    return null;
  }
}

async function getExternalRecipes(query: string): Promise<RecipeResult[]> {
  const terms = query.includes(',')
    ? query.split(',').map(normaliseTerm).filter(Boolean).slice(0, 5)
    : [query, ...query.split(/\s+/).filter((term) => term.length >= 4).slice(0, 2)].map(normaliseTerm).filter(Boolean).slice(0, 5);
  const urls = [
    `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`,
    ...terms.map((term) => `${THEMEALDB_BASE}/filter.php?i=${encodeURIComponent(term.replace(/\s+/g, '_'))}`),
  ];

  const responses = await Promise.all(
    urls.map(async (url) => {
      try {
        return await fetchJson(url);
      } catch {
        return null;
      }
    }),
  );

  const ids = new Set<string>();
  for (const payload of responses) {
    const meals = (payload?.meals ?? []) as MealSummary[];
    for (const meal of meals) {
      if (meal?.idMeal) ids.add(meal.idMeal);
    }
  }

  const details = await Promise.all(Array.from(ids).slice(0, 18).map((id) => getMealDetails(id)));
  return details.filter((item): item is RecipeResult => Boolean(item));
}

async function getRandomRecipe(): Promise<RecipeResult[]> {
  const data = await fetchJson(`${THEMEALDB_BASE}/random.php`);
  const meal = data?.meals?.[0] as Meal | undefined;
  return meal ? [mealToRecipe(meal)] : [];
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const title = String(body.title ?? '').trim();
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((ingredient: unknown) => String(ingredient).trim()).filter(Boolean)
      : [];
    const instructions = String(body.instructions ?? '').trim();

    if (!title || ingredients.length === 0 || !instructions) {
      return new NextResponse('Bad Request: Missing required fields', { status: 400 });
    }

    if (title.length > 160 || ingredients.length > 100 || instructions.length > 20000) {
      return new NextResponse('Recipe is too large', { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: { title, ingredients, instructions, userId },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Create recipe error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id } = await req.json();
    const recipeId = String(id ?? '').trim();
    if (!recipeId) return new NextResponse('Missing recipe id', { status: 400 });

    const result = await prisma.recipe.deleteMany({ where: { id: recipeId, userId } });
    if (result.count === 0) return new NextResponse('Recipe not found', { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = normaliseTerm(searchParams.get('q') || searchParams.get('ingredients') || '');
  const random = searchParams.get('random') === '1';

  try {
    if (random) {
      return NextResponse.json(await getRandomRecipe());
    }

    if (!query) {
      return NextResponse.json([]);
    }

    const searchTerms = query.includes(',')
      ? query.split(',').map(normaliseTerm).filter(Boolean).slice(0, 8)
      : [query];
    const ingredientTerms = query.includes(',')
      ? searchTerms
      : query.split(/\s+/).map(normaliseTerm).filter((term) => term.length >= 4).slice(0, 5);

    const candidates = await prisma.recipe.findMany({
      take: 250,
      orderBy: { createdAt: 'desc' },
    });

    const localRecipes: RecipeResult[] = candidates
      .filter((recipe) => {
        const title = recipe.title.toLowerCase();
        const ingredients = recipe.ingredients.map((item) => item.toLowerCase());
        if (title.includes(query)) return true;
        if (query.includes(',')) return searchTerms.every((term) => ingredients.some((item) => item.includes(term)));
        return ingredientTerms.some((term) => ingredients.some((item) => item.includes(term)));
      })
      .slice(0, 20)
      .map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image: null,
        source: 'Community',
        savable: false,
      }));

    const externalRecipes = await getExternalRecipes(query);
    const combined = new Map<string, RecipeResult>();

    for (const recipe of [...localRecipes, ...externalRecipes]) {
      combined.set(recipe.id, recipe);
    }

    return NextResponse.json(Array.from(combined.values()).slice(0, 30));
  } catch (error) {
    console.error('Recipe search error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

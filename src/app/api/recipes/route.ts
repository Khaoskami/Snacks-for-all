import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

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
  const rawQuery = searchParams.get('ingredients')?.trim();
  if (!rawQuery) return NextResponse.json([]);

  const searchTerms = rawQuery.split(',').map((term) => term.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  if (searchTerms.length === 0) return NextResponse.json([]);

  try {
    // Fetch a modest set and filter in JavaScript so searches work with values such as
    // "chicken" matching "chicken breast", instead of requiring exact array equality.
    const candidates = await prisma.recipe.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    const localRecipes = candidates.filter((recipe) => {
      const ingredients = recipe.ingredients.map((item) => item.toLowerCase());
      return searchTerms.every((term) => ingredients.some((item) => item.includes(term)));
    }).slice(0, 20);

    const formattedLocal = localRecipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      image: null,
      source: 'community',
      savable: false,
    }));

    const primaryIngredient = encodeURIComponent(searchTerms[0]);
    const mealRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryIngredient}`, {
      next: { revalidate: 300 },
    });
    if (!mealRes.ok) return NextResponse.json(formattedLocal);

    const mealData = await mealRes.json();
    const meals = mealData.meals?.slice(0, 10) ?? [];

    const external = await Promise.all(meals.map(async (meal: { idMeal: string }) => {
      try {
        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`, {
          next: { revalidate: 300 },
        });
        if (!detailRes.ok) return null;
        const detailData = await detailRes.json();
        const item = detailData.meals?.[0];
        if (!item) return null;

        const ingredients: string[] = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = item[`strIngredient${i}`];
          const measure = item[`strMeasure${i}`];
          if (ingredient?.trim()) ingredients.push(`${measure?.trim() ? `${measure.trim()} ` : ''}${ingredient.trim()}`.trim());
        }

        return {
          id: `mealdb-${item.idMeal}`,
          title: item.strMeal,
          ingredients,
          instructions: item.strInstructions,
          image: item.strMealThumb,
          source: 'TheMealDB',
          savable: true,
        };
      } catch {
        return null;
      }
    }));

    return NextResponse.json([...formattedLocal, ...external.filter(Boolean)]);
  } catch (error) {
    console.error('Recipe search error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

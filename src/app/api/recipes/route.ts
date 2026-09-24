import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const { title, ingredients, instructions } = body;

    if (!title || !Array.isArray(ingredients) || ingredients.length === 0 || !instructions) {
      return new NextResponse('Bad Request: Missing required fields', { status: 400 });
    }

    const cleanIngredients = ingredients
      .map((ingredient: unknown) => String(ingredient).trim())
      .filter(Boolean);

    const recipe = await prisma.recipe.create({
      data: {
        title: String(title).trim(),
        ingredients: cleanIngredients,
        instructions: String(instructions).trim(),
        userId,
      },
    });

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Create recipe error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('ingredients')?.trim();

  if (!rawQuery) return NextResponse.json([]);

  const searchTerms = rawQuery
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  try {
    const localRecipes = await prisma.recipe.findMany({
      where: {
        OR: searchTerms.flatMap((term) => [
          { ingredients: { has: term } },
          { ingredients: { has: term.charAt(0).toUpperCase() + term.slice(1) } },
        ]),
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const formattedLocal = localRecipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      image: null,
    }));

    const primaryIngredient = encodeURIComponent(searchTerms[0]);
    const mealRes = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryIngredient}`,
      { next: { revalidate: 300 } }
    );

    const mealData = await mealRes.json();
    const meals = mealData.meals?.slice(0, 10) ?? [];

    const external = await Promise.all(
      meals.map(async (meal: { idMeal: string }) => {
        const detailRes = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`,
          { next: { revalidate: 300 } }
        );
        const detailData = await detailRes.json();
        const item = detailData.meals?.[0];
        if (!item) return null;

        const ingredients: string[] = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = item[`strIngredient${i}`];
          if (ingredient?.trim()) ingredients.push(ingredient.trim());
        }

        return {
          id: `mealdb-${item.idMeal}`,
          title: item.strMeal,
          ingredients,
          instructions: item.strInstructions,
          image: item.strMealThumb,
        };
      })
    );

    return NextResponse.json([...formattedLocal, ...external.filter(Boolean)]);
  } catch (error) {
    console.error('Recipe search error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

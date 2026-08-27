import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, ingredients, instructions } = body;
    const recipe = await prisma.recipe.create({
      data: {
        title,
        ingredients: ingredients.split(',').map((i: string) => i.trim().toLowerCase()),
        instructions,
      },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ingredientsParam = searchParams.get('ingredients');

  if (!ingredientsParam) return NextResponse.json([]);

  const searchIngredients = ingredientsParam.split(',').map(i => i.trim().toLowerCase());
  // TheMealDB requires underscores for multi-word ingredients (e.g. chicken_breast)
  const firstIngredient = searchIngredients[0].replace(/\s+/g, '_');

  let localRecipes: any[] = [];
  try {
    // Makes the DB optional so the app won't break if Railway DB isn't linked
    localRecipes = await prisma.recipe.findMany({
      where: { ingredients: { hasSome: searchIngredients } },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.warn("Database bypassed or not connected.");
  }

  let externalRecipes: any[] = [];
  try {
    const searchRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${firstIngredient}`);
    const searchData = await searchRes.json();

    if (searchData.meals) {
      const topMeals = searchData.meals.slice(0, 9);
      const detailedMealsPromises = topMeals.map(async (meal: any) => {
        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        const detailData = await detailRes.json();
        return detailData.meals[0];
      });

      const fullMeals = await Promise.all(detailedMealsPromises);

      externalRecipes = fullMeals.map((meal: any) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];
          if (ingredient && ingredient.trim() !== '') {
            ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`);
          }
        }
        return {
          id: meal.idMeal,
          title: meal.strMeal,
          ingredients: ingredients,
          instructions: meal.strInstructions,
          image: meal.strMealThumb
        };
      });
    }
  } catch (error) {
    console.error("TheMealDB fetch failed", error);
  }

  return NextResponse.json([...localRecipes, ...externalRecipes]);
}
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
  
  // TheMealDB free tier searches one ingredient at a time, so we grab the first one
  const firstIngredient = searchIngredients[0];

  try {
    // 1. Fetch from your local Postgres database
    const localRecipes = await prisma.recipe.findMany({
      where: {
        ingredients: {
          hasSome: searchIngredients
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch from TheMealDB
    const searchRes = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${firstIngredient}`
    );
    const searchData = await searchRes.json();

    let externalRecipes: any[] = [];

    if (searchData.meals) {
      // Limit to 10 results so we don't spam the API or slow down the response
      const topMeals = searchData.meals.slice(0, 10);
      
      const detailedMealsPromises = topMeals.map(async (meal: any) => {
        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        const detailData = await detailRes.json();
        return detailData.meals[0];
      });

      const fullMeals = await Promise.all(detailedMealsPromises);

      // TheMealDB returns ingredients as 20 separate numbered strings. 
      // We map this chaotic format into our clean array format.
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
          title: `[Online] ${meal.strMeal}`, // Tags it so you know it came from the web
          ingredients: ingredients,
          instructions: meal.strInstructions,
          image: meal.strMealThumb // We are passing this down for the UI!
        };
      });
    }

    // 3. Combine both and return
    return NextResponse.json([...localRecipes, ...externalRecipes]);
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
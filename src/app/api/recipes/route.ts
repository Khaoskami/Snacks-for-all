export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('ingredients');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // 1. Fetch Local Custom Recipes from PostgreSQL
    // Assumes ingredients is a String[] array in your Prisma schema
    const localRecipes = await prisma.recipe.findMany({
      where: {
        ingredients: {
          has: query,
        },
      },
      take: 5,
    });

    const formattedLocal = localRecipes.map((r) => ({
      id: r.id.toString(),
      title: r.title,
      ingredients: r.ingredients,
      instructions: r.instructions,
      image: null, // Local uploads don't have images based on your schema
    }));

    // 2. Fetch External Recipes from TheMealDB (Step 1: Filter by Ingredient)
    const mealRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${query}`);
    const mealData = await mealRes.json();
    
    let formattedExternal: any[] = [];

    if (mealData.meals) {
      // Limit to 5 to avoid getting rate-limited during Step 2
      const mealsToFetch = mealData.meals.slice(0, 5);

      // Step 2: Fetch detailed instructions and full ingredients for each meal
      const detailPromises = mealsToFetch.map(async (meal: any) => {
        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        const detailData = await detailRes.json();
        return detailData.meals?.[0];
      });

      const detailedMeals = await Promise.all(detailPromises);

      formattedExternal = detailedMeals.filter(Boolean).map((meal) => {
        // TheMealDB returns ingredients as 20 distinct keys (strIngredient1, strIngredient2, etc.)
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = meal[`strIngredient${i}`];
          if (ingredient && ingredient.trim() !== '') {
            ingredients.push(ingredient.trim());
          }
        }

        return {
          id: `mealdb-${meal.idMeal}`,
          title: meal.strMeal,
          ingredients,
          instructions: meal.strInstructions,
          image: meal.strMealThumb,
        };
      });
    }

    // 3. Merge and return a unified response
    return NextResponse.json([...formattedLocal, ...formattedExternal]);

  } catch (error) {
    console.error("Hybrid Search Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
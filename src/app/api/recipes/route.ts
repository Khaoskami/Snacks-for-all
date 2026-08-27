export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('ingredients');

  if (!rawQuery) {
    return NextResponse.json([]);
  }

  // 1. Sanitize and split the query (e.g., "chicken, garlic" -> ["chicken", "garlic"])
  const searchTerms = rawQuery.split(',').map(term => term.trim()).filter(Boolean);
  
  if (searchTerms.length === 0) {
    return NextResponse.json([]);
  }

  try {
    // 2. Fetch Local Custom Recipes from PostgreSQL
    const localRecipes = await prisma.recipe.findMany({
      where: {
        ingredients: {
          hasSome: searchTerms, 
        },
      },
      take: 5,
    });

    const formattedLocal = localRecipes.map((r) => ({
      id: r.id.toString(),
      title: r.title,
      ingredients: r.ingredients,
      instructions: r.instructions,
      image: null, 
    }));

    // 3. Fetch External Recipes from TheMealDB
    const primaryIngredient = searchTerms[0];
    const mealRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryIngredient}`);
    const mealData = await mealRes.json();
    
    let formattedExternal: any[] = [];

    if (mealData.meals) {
      const mealsToFetch = mealData.meals.slice(0, 5);

      const detailPromises = mealsToFetch.map(async (meal: any) => {
        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        const detailData = await detailRes.json();
        return detailData.meals?.[0];
      });

      const detailedMeals = await Promise.all(detailPromises);

      formattedExternal = detailedMeals.filter(Boolean).map((meal) => {
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

    // 4. Merge and return unified response
    return NextResponse.json([...formattedLocal, ...formattedExternal]);

  } catch (error) {
    console.error("Hybrid Search Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

    if (mealData.meals) {
      const mealsToFetch = mealData.meals.slice(0, 5);

      const detailPromises = mealsToFetch.map(async (meal: any) => {
        const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        const detailData = await detailRes.json();
        return detailData.meals?.[0];
      });

      const detailedMeals = await Promise.all(detailPromises);

      formattedExternal = detailedMeals.filter(Boolean).map((meal) => {
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

    // 3. Merge and return unified response
    return NextResponse.json([...formattedLocal, ...formattedExternal]);

  } catch (error) {
    console.error("Hybrid Search Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
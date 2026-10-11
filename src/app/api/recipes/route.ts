import { readBody, textField, InvalidBody } from '@/lib/request-body';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

import { normaliseTerm, searchRecipes } from '@/lib/recipe-search';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await readBody(req);
    const title = textField(body.title);
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((ingredient: unknown) => textField(ingredient)).filter(Boolean)
      : [];
    const instructions = textField(body.instructions);

    if (!title || ingredients.length === 0 || !instructions) {
      return new NextResponse('Bad Request: Missing required fields', { status: 400 });
    }

    if (title.length > 160 || ingredients.length > 100 || ingredients.some((item: string) => item.length > 500) || instructions.length > 20000) {
      return new NextResponse('Recipe is too large', { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: { title, ingredients, instructions, userId },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidBody) return new NextResponse('Invalid request body', { status: 400 });
    console.error('Create recipe error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id } = await readBody(req);
    const recipeId = textField(id);
    if (!recipeId) return new NextResponse('Missing recipe id', { status: 400 });

    const result = await prisma.recipe.deleteMany({ where: { id: recipeId, userId } });
    if (result.count === 0) return new NextResponse('Recipe not found', { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof InvalidBody) return new NextResponse('Invalid request body', { status: 400 });
    console.error('Delete recipe error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = normaliseTerm(searchParams.get('q') || searchParams.get('ingredients') || '');
  const random = searchParams.get('random') === '1';
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (query.length > 200 || query.split(',').filter(term => term.trim()).length > 5) {
    return NextResponse.json({ error: 'Use up to five ingredients and 200 characters.' }, { status: 400, headers });
  }
  if (!query && !random) return NextResponse.json([], { headers });
  try {
    // Public discovery never reads the private Recipe or SavedRecipe tables.
    const result = await searchRecipes(query, random);
    if (result.warning) headers['X-Recipe-Warning'] = result.warning;
    return NextResponse.json(result.recipes, { headers });
  } catch {
    console.error('External recipe search unavailable');
    return NextResponse.json({ error: 'Recipe search is temporarily unavailable. Please try again.' }, { status: 502, headers });
  }
}

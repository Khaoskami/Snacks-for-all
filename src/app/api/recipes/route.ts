import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, ingredients, instructions } = body;

    if (!title || !ingredients || !instructions) {
      return new NextResponse("Bad Request: Missing required fields", { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        ingredients,
        instructions,
        userId,
      },
    });

    return NextResponse.json(recipe);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
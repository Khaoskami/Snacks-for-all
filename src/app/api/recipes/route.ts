import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust this import to your actual Prisma client location

export async function POST(req: Request) {
  // Await auth() to resolve the Promise and extract userId
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, ingredients, instructions } = body;

  const recipe = await prisma.recipe.create({
    data: {
      title,
      ingredients,
      instructions,
      userId, // Satisfies the updated schema relation
    },
  });

  return NextResponse.json(recipe);
}
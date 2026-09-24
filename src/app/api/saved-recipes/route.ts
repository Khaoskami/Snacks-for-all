import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const externalId = String(body.externalId ?? '').trim();
    const title = String(body.title ?? '').trim();
    const image = body.image ? String(body.image) : null;

    if (!externalId || !title) return new NextResponse('Missing recipe details', { status: 400 });

    const existing = await prisma.savedRecipe.findFirst({ where: { userId, externalId } });
    if (existing) return NextResponse.json(existing);

    const saved = await prisma.savedRecipe.create({
      data: { userId, externalId, title, image },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Save recipe error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id } = await req.json();
    const savedId = String(id ?? '').trim();
    if (!savedId) return new NextResponse('Missing saved recipe id', { status: 400 });

    const result = await prisma.savedRecipe.deleteMany({ where: { id: savedId, userId } });
    if (result.count === 0) return new NextResponse('Saved recipe not found', { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete saved recipe error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

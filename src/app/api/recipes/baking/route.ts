import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  
  // Fetches strictly baking and dessert recipes
  const res = await fetch(
    `https://api.spoonacular.com/recipes/complexSearch?type=dessert,bread&number=12&apiKey=${apiKey}`
  );
  
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch baking recipes' }, { status: 500 });
  
  const data = await res.json();
  return NextResponse.json(data.results);
}
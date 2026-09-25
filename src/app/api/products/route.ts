import { NextResponse } from 'next/server';

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

type ProductApiItem = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_small_url?: string;
  nutriscore_grade?: string;
  stores?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query) return NextResponse.json([]);
  if (query.length > 100) return NextResponse.json({ error: 'Search is too long.' }, { status: 400 });

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '24',
      fields: 'code,product_name,brands,image_front_small_url,nutriscore_grade,stores',
    });

    const response = await fetch(`${OPEN_FOOD_FACTS_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': process.env.OPEN_FOOD_FACTS_USER_AGENT || 'SnacksForAll/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) throw new Error(`Open Food Facts returned ${response.status}`);

    const data = await response.json();
    const products = ((data?.products || []) as ProductApiItem[])
      .filter((product) => product.code && product.product_name)
      .map((product) => ({
        id: product.code as string,
        name: product.product_name as string,
        brand: product.brands || '',
        image: product.image_front_small_url || null,
        nutriscore: product.nutriscore_grade || null,
        stores: product.stores || '',
        url: `https://world.openfoodfacts.org/product/${encodeURIComponent(product.code as string)}`,
      }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json({ error: 'Product search is temporarily unavailable.' }, { status: 502 });
  }
}

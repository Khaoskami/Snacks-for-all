import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), currentUser: vi.fn(), savedFindMany: vi.fn(), findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn(), savedDelete: vi.fn(), savedFind: vi.fn(), savedCreate: vi.fn() }));
vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth, currentUser: mocks.currentUser }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  recipe: { findMany: mocks.findMany, create: mocks.create, deleteMany: mocks.deleteMany },
  savedRecipe: { findMany: mocks.savedFindMany, deleteMany: mocks.savedDelete, findFirst: mocks.savedFind, create: mocks.savedCreate },
} }));
import { GET, POST, DELETE } from '../src/app/api/recipes/route';
import { DELETE as removeSaved, POST as save } from '../src/app/api/saved-recipes/route';
import AccountPage from '../src/app/account/page';
import { searchRecipes } from '../src/lib/recipe-search';
const meal = (id: string, name = 'Chicken soup') => ({ idMeal: id, strMeal: name, strInstructions: 'Cook.', strIngredient1: 'Chicken', strMeasure1: '100g' });
const json = (meals: unknown) => new Response(JSON.stringify({ meals }), { headers: { 'Content-Type': 'application/json' } });
const request = (method: string, body: object) => new Request('http://localhost/api/recipes', { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: 'ordinary-user' });
  mocks.findMany.mockRejectedValue(new Error('Database down'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([meal('1')])));
});
it('public discovery works with database down and never reads personal recipes', async () => {
  const response = await GET(new Request('http://localhost/api/recipes?q=chicken'));
  expect(response.status).toBe(200);
  expect((await response.json())[0].id).toBe('mealdb-1');
  expect(mocks.findMany).not.toHaveBeenCalled();
  expect(mocks.auth).not.toHaveBeenCalled();
});
it('requires all ingredients, deduplicates, and hydrates filter results', async () => {
  vi.mocked(fetch).mockImplementation(async input => {
    const url = String(input);
    if (url.includes('i=chicken')) return json([{ idMeal: '1', strMeal: 'A' }, { idMeal: '2', strMeal: 'B' }]);
    if (url.includes('i=garlic')) return json([{ idMeal: '2', strMeal: 'B' }, { idMeal: '3', strMeal: 'C' }]);
    return json([meal('2')]);
  });
  const result = await searchRecipes('chicken, garlic');
  expect(result.recipes.map(r => r.id)).toEqual(['mealdb-2']);
  expect(result.recipes[0].ingredients).toEqual(['100g Chicken']);
});
it('reuses complete name results instead of fetching every detail again', async () => {
  vi.mocked(fetch).mockImplementation(async input => String(input).includes('search.php') ? json([meal('1')]) : json(null));
  expect((await searchRecipes('chicken')).recipes).toHaveLength(1);
  expect(fetch).toHaveBeenCalledTimes(3);
});
it('returns genuine empty results for a successful no-match search', async () => {
  vi.mocked(fetch).mockImplementation(async () => json(null));
  const response = await GET(new Request('http://localhost/api/recipes?q=nothingmatches'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([]);
});
it('returns 502, not a false empty success, on upstream failure or timeout', async () => {
  vi.mocked(fetch).mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
  expect((await GET(new Request('http://localhost/api/recipes?q=chicken'))).status).toBe(502);
});
it('shows partial failure warnings when valid results are available', async () => {
  vi.mocked(fetch).mockImplementation(async input => {
    if (String(input).includes('search.php')) return json([meal('1')]);
    throw new Error('Provider down');
  });
  const response = await GET(new Request('http://localhost/api/recipes?q=chicken'));
  expect(response.status).toBe(200);
  expect(response.headers.get('x-recipe-warning')).toBeTruthy();
});
it('fails multi-ingredient search if any ingredient request fails', async () => {
  vi.mocked(fetch).mockImplementation(async input => {
    if (String(input).includes('chicken')) return json([meal('1')]);
    throw new Error('Provider down');
  });
  await expect(searchRecipes('chicken, garlic')).rejects.toThrow();
});
it('rejects malformed provider payloads', async () => {
  vi.mocked(fetch).mockImplementation(async () => new Response('{}'));
  await expect(searchRecipes('chicken')).rejects.toThrow();
});
it('bounds queries before making external requests', async () => {
  expect((await GET(new Request('http://localhost/api/recipes?q=' + 'x'.repeat(201)))).status).toBe(400);
  expect((await GET(new Request('http://localhost/api/recipes?q=a,b,c,d,e,f'))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it('does not cache random requests and sets an abort signal', async () => {
  await searchRecipes('', true);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/random.php'), expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }));
});
it('ignores forged owner IDs on creation', async () => {
  mocks.create.mockResolvedValue({ id: 'new' });
  expect((await POST(request('POST', { title: 'Dinner', ingredients: ['rice'], instructions: 'Boil', userId: 'admin-user' }))).status).toBe(201);
  expect(mocks.create).toHaveBeenCalledWith({ data: { title: 'Dinner', ingredients: ['rice'], instructions: 'Boil', userId: 'ordinary-user' } });
});
it('cannot delete another user or admin recipe', async () => {
  mocks.deleteMany.mockResolvedValue({ count: 0 });
  expect((await DELETE(request('DELETE', { id: 'admin-recipe', userId: 'admin-user' }))).status).toBe(404);
  expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: 'admin-recipe', userId: 'ordinary-user' } });
});
it('cannot delete another user saved recipe', async () => {
  mocks.savedDelete.mockResolvedValue({ count: 0 });
  expect((await removeSaved(request('DELETE', { id: 'admin-save' }))).status).toBe(404);
  expect(mocks.savedDelete).toHaveBeenCalledWith({ where: { id: 'admin-save', userId: 'ordinary-user' } });
});
it('blocks anonymous writes without touching the database', async () => {
  mocks.auth.mockResolvedValue({ userId: null });
  for (const handler of [POST, DELETE, save, removeSaved]) expect((await handler(request('POST', {}))).status).toBe(401);
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.deleteMany).not.toHaveBeenCalled();
  expect(mocks.savedDelete).not.toHaveBeenCalled();
  expect(mocks.savedCreate).not.toHaveBeenCalled();
});

it('account reads are scoped to the authenticated user, including saved recipes', async () => {
  mocks.currentUser.mockResolvedValue({ firstName: 'User' });
  mocks.findMany.mockResolvedValue([]);
  mocks.savedFindMany.mockResolvedValue([]);
  await AccountPage();
  const scope = { where: { userId: 'ordinary-user' }, orderBy: { createdAt: 'desc' } };
  expect(mocks.findMany).toHaveBeenCalledWith(scope);
  expect(mocks.savedFindMany).toHaveBeenCalledWith(scope);
});
it('returns 400 for invalid JSON rather than an internal error', async () => {
  expect((await POST(new Request('http://localhost/api/recipes', { method: 'POST', body: '{' }))).status).toBe(400);
});
it('rejects unsafe image schemes in saved recipes', async () => {
  expect((await save(request('POST', { externalId: 'mealdb-1', title: 'Test', image: 'javascript:alert(1)' }))).status).toBe(400);
  expect(mocks.savedCreate).not.toHaveBeenCalled();
});

import { expect, it } from 'vitest';
import { searchRecipes } from '../src/lib/recipe-search';

// Opt-in network smoke test. Routine tests stay deterministic and offline.
it.skipIf(process.env.RUN_LIVE !== '1')('retrieves real recipe names, ingredients and random meals', async () => {
  for (const query of ['chicken', 'chicken, garlic', 'breakfast']) {
    const result = await searchRecipes(query);
    expect(result.recipes.length, query).toBeGreaterThan(0);
    expect(result.recipes[0].instructions).toBeTruthy();
    expect(result.recipes[0].ingredients.length).toBeGreaterThan(0);
  }
  expect((await searchRecipes('', true)).recipes).toHaveLength(1);
}, 45000);

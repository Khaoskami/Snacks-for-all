# Snacks for All

Next.js + Clerk + Prisma/PostgreSQL, deployed from GitHub to Railway.

## Replacement update: middleware/proxy deployment conflict

This package includes an automatic compatibility step in `npm run build`, `npm run dev`, and `npm run typecheck`. It moves old root-level or `src/` middleware files (`.ts`, `.tsx`, `.js`, `.jsx`) into `.legacy-build-backups/` with a `.disabled` suffix before Next.js runs. It first checks that the supplied `src/proxy.ts` exists and never removes it. Old file contents are preserved in that build's filesystem. Backups on Railway are temporary and are not committed to GitHub.

Upload **all extracted project contents** into the existing repository's application folder, including `scripts/prepare-build.mjs`, `package.json` and `railway.json`. Commit to the Railway-connected branch. Keep the Railway build command as `npm run build`. You do not need to manually delete the old middleware file for deployment to succeed.

A ZIP upload does not literally delete absent files from GitHub. This compatibility step handles the middleware conflict shown in your deployment log; it does not delete unrelated old files. For an exact repository replacement, replace the tracked application files using Git while preserving your repository history and deployment settings.

## Access rules

- **Admin:** only the authenticated Clerk account whose **verified primary email** is `asadtitus@gmail.com` (case-insensitive exact match).
- **Every other account:** ordinary user. Clerk metadata, URL parameters, browser storage, submitted email addresses and submitted role fields cannot grant admin access.
- `/admin` and `/api/admin/status` check the role on the server before loading diagnostics. The navigation only shows Admin to the administrator. Signed-out API requests receive 401; ordinary users receive 403. Ordinary users visiting `/admin` receive a not-found page.
- Ordinary users can search, upload their own private recipes, save external recipes and delete only their own records. Account queries are scoped to the authenticated Clerk user ID, including for the admin.
- Public recipe search returns only external recipes. Previously uploaded recipes remain in their owner's account; they are no longer exposed through public search.
- Deployment/setup instructions live in the admin dashboard and this README. Public pages show customer-facing availability messages. Public payment links and the public ordering email remain intentionally visible to customers.

The uploaded project contained no existing admin dashboard or separate admin CRUD features. This update adds a protected setup/status dashboard without inventing user-management powers or making personal recipe uploads admin-only.

## GitHub to Railway: deploy this update

1. Extract the ZIP. Copy the **contents** of `Snacks-for-all-main/` into the root of your existing GitHub repository, replacing the matching files. Replace `tailwind.config.ts` with the supplied compatibility stub; styling is now configured in CSS. Include `package-lock.json`, `railway.json`, `.gitignore`, tests, and all new `src/lib` and `src/app/admin` files. Do not upload the ZIP itself or an extra nested project folder as the application root.
2. Commit and push to the branch connected to Railway. If your project intentionally uses a subfolder, set Railway's service root directory to that folder.
3. Use Node **22.12+** (Node 24 LTS is suitable). `package.json` declares the minimum; the lockfile makes dependency installation repeatable. Allow dev dependencies during the build because Prisma, TypeScript and Tailwind are build tools.
4. Configure the service variables listed below, then redeploy. `NEXT_PUBLIC_*` values are embedded at build time and require a rebuild when changed.
5. `railway.json` sets build to `npm run build`, start to `npm run start`, and health check to `/api/health`. The start command binds to `0.0.0.0` and Next.js uses Railway's injected `PORT`.
6. Connect Railway PostgreSQL and set `DATABASE_URL` to its connection string. The schema is **unchanged** by this patch. If your existing deployment already has `Recipe` and `SavedRecipe`, no database migration is required. For a new empty database, run `npm run db:setup` in a Railway environment that has the database connection. Alternatively set that command as the first-deployment pre-deploy command and remove it after initialization. This command does not use `--accept-data-loss` or reset data. For future schema changes, introduce reviewed Prisma migrations and use `prisma migrate deploy` as the pre-deploy command.
7. In Clerk, use matching publishable/secret keys for the same instance. Configure the Railway/custom domain for production. Sign in as `asadtitus@gmail.com` and ensure it is the **verified primary email**. Enable email verification in Clerk sign-up settings. No manual role metadata is needed.
8. Run the launch checks below.

### Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key |
| `CLERK_SECRET_KEY` | Yes | Server secret; never prefix it with `NEXT_PUBLIC_` |
| `DATABASE_URL` | For account storage | Railway PostgreSQL connection |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Recommended | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Recommended | `/sign-up` |
| `THEMEALDB_API_KEY` | Optional | Defaults to `1`; configure an appropriate production key when required |
| `OPEN_FOOD_FACTS_USER_AGENT` | Recommended | E.g. `SnacksForAll/1.0 (contact: your-public-support-email)` |
| `NEXT_PUBLIC_PAYPAL_DONATION_URL` | Optional | Real PayPal donation URL; leave unset until ready |
| `NEXT_PUBLIC_ORDER_EMAIL` | Optional | Public order-request destination; leave unset until ready |

There is no `ADMIN_EMAIL` environment override: the sole admin email is the requested value in the server's access policy.

## Recipe search

TheMealDB is retained and repaired. A live request confirmed it was reachable; the old implementation failed because it queried PostgreSQL before contacting TheMealDB and returned a misleading empty success on any database error.

- Search by recipe name (`Arrabiata`), ingredient (`chicken`) or category (`breakfast`).
- Separate up to five ingredients with commas (`chicken, garlic`). The server intersects the results of documented V1 single-ingredient endpoints; all requested ingredients must match. This does not call the premium V2 multi-ingredient endpoint.
- External search does not need a working database or signed-in user. Saving recipes still requires both.
- Queries are limited to 200 characters and results to 24 recipes. Full name-search data is reused, detail lookups run at most four at a time, and the search has a shared 10-second upstream budget.
- Successful external responses are cached for 10 minutes by Next.js. Random recipe requests are not cached. Source attribution and original recipe links remain visible.
- Provider failures return 502, valid no-match searches return an empty 200, and partial results include a visible warning.
- This searches TheMealDB's catalogue, not the entire web. Ingredient spelling and catalogue coverage affect results; it is not an allergy-safety checker.

### Free-access limits

TheMealDB documents key `1` for development/educational use and requires supporter access for public app-store releases. Its terms also describe free usage in terms of development projects. The free integration works technically, but this is **not a promise of unrestricted free commercial production licensing**. Confirm the intended public Railway site's use with TheMealDB or supply an appropriate production key before commercial launch. No subscription has been purchased.

Edamam was also reviewed; its listed entry recipe-search plan is paid and third-party recipe results do not include full cooking instructions, so it was not chosen as the free replacement.

## Launch checks using your real accounts

1. Signed out: recipe search works; `/api/admin/status` returns 401; saved/creation/deletion endpoints reject writes.
2. Sign in with an ordinary verified email: no Admin link; direct `/admin` access returns not found; `/api/admin/status` returns 403.
3. Sign in with the verified primary email `asadtitus@gmail.com`: Admin link and dashboard are available.
4. Create distinct recipes in two accounts. Each account must show only its own records. Public recipe search must not return either private upload.
5. Search `chicken`, `chicken, garlic`, `breakfast`, and use Surprise me. Save and remove a recipe using a real account.
6. Check database status on `/admin`, then test actual donation/order links if configured.

The public health endpoint is a process liveness check only; it does not expose configuration or verify the database or Clerk service.

## Local development and tests

```sh
cp .env.example .env
# Replace placeholder Clerk/database values. Keep .env out of Git.
npm ci
npx prisma generate
npm run db:setup
npm run dev
```

Use `.env` so both Prisma CLI and Next.js can read local configuration.

```sh
npm test
npm run typecheck
npm run build
npm audit --omit=dev
# Optional network test (POSIX shell):
RUN_LIVE=1 npx vitest run tests/live.test.ts
```

Tests mock Clerk/database responses for repeatability. They do not replace the real-account checks above. A local build does not deploy to GitHub or Railway.

## Research references

- Next.js authorization guidance: https://nextjs.org/docs/app/guides/authentication
- Clerk server user lookup: https://clerk.com/docs/reference/nextjs/app-router/current-user
- Clerk email verification object: https://clerk.com/docs/reference/backend/types/backend-email-address
- TheMealDB endpoints/free key: https://www.themealdb.com/api.php
- TheMealDB terms: https://www.themealdb.com/terms_of_use.php
- Edamam plans: https://developer.edamam.com/edamam-recipe-api
- Railway Next.js deployment: https://docs.railway.com/guides/nextjs

## Dependency maintenance

Next.js is patched to 16.3.8. The full dependency audit also identified outdated CSS build dependencies, so Tailwind was migrated to 4.3.3 with its dedicated PostCSS plugin and PostCSS 8.5.29. The old empty Tailwind configuration was replaced with a compatibility stub, shadow/outline utilities were adjusted, and the original border default was retained. Tailwind 4 requires modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+).

Migration reference: https://tailwindcss.com/docs/upgrade-guide

## Verification for this update

- 31 automated tests passed (admin page/API access, verified-email policy, account isolation, forged owner IDs, anonymous writes, provider errors, query validation and unsafe saved image schemes).
- Separate opt-in live test passed for `chicken`, `chicken, garlic`, `breakfast` and random meals.
- Production build and TypeScript checks passed.
- Full `npm audit` reported zero known vulnerabilities at verification time.
- Prisma schema is byte-for-byte unchanged from the uploaded project.
- Actual Clerk sessions, production database operations and Railway deployment were not exercised because production credentials were not supplied. Use the real-account launch checklist above.

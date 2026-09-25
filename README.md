# Snacks for All

Snacks for All is a Next.js recipe and food-shopping app using Clerk authentication, Prisma/Postgres, TheMealDB for recipe discovery, and Open Food Facts for product data.

## What works

Recipe discovery is public. Search can match general recipe names such as `lasagne` as well as ingredients such as `chicken`. The app combines TheMealDB results with recipes users have added themselves.

Signed-in users can add recipes, see their own recipes in My Account, delete their own recipes, save external recipes, and remove saved recipes.

The Shop section searches real food products through Open Food Facts and provides a local browser basket. When `NEXT_PUBLIC_ORDER_EMAIL` is configured, users can create an email order request containing their basket. This is intentionally not presented as a card-payment checkout because a real merchant/order processor has not been connected.

The Donation section can use a PayPal donation URL through `NEXT_PUBLIC_PAYPAL_DONATION_URL`. The URL is optional so the app never pretends a donation processor is connected when it is not.

## Railway variables

In Railway open your service, open Variables, and add:

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

`CLERK_SECRET_KEY`

`DATABASE_URL`

`THEMEALDB_API_KEY`

`OPEN_FOOD_FACTS_USER_AGENT`

`NEXT_PUBLIC_PAYPAL_DONATION_URL` (optional)

`NEXT_PUBLIC_ORDER_EMAIL` (optional)

Railway makes service variables available at build and runtime. Do not place `CLERK_SECRET_KEY` in client-side code or a public variable. See the current Railway and Clerk documentation for details.

## Clerk setup

Create or open the Clerk application, go to API keys, and copy the Publishable Key and Secret Key. Put those values into the two Clerk variables above.

The app uses the standard Clerk sign-in/sign-up routes and redirects signed-in users to their requested page after authentication.

## Recipe API setup

TheMealDB's current V1 API documents a free development/test key of `1`, including search by meal name, lookup by ID, random recipes, categories, and single-ingredient filtering. For a public appstore release, TheMealDB asks developers to use the appropriate supporter/commercial access. The code keeps the key in `THEMEALDB_API_KEY` so you can switch to a supporter key later without changing the application.

For the current free setup, set:

`THEMEALDB_API_KEY=1`

No separate API key is needed to start the app.

## Product API setup

Open Food Facts states that read operations do not require authentication. The app calls its product search through the server and sends a custom User-Agent. There is no API key to copy into Railway for this feature.

## Database setup

Attach a PostgreSQL database to the Railway project or use an existing PostgreSQL service. Make sure `DATABASE_URL` points at it.

On first deploy, run the Prisma schema setup required by your Railway workflow, for example `npx prisma db push`, then redeploy if necessary.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add your Clerk and database values.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npx prisma db push` against your development database.
6. Run `npm run dev`.

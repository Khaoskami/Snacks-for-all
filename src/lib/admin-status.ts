import 'server-only';
import { prisma } from './prisma';

// Call only after getAccess() has granted admin access. Never return secret values.
export async function getAdminStatus() {
  let databaseAvailable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseAvailable = true;
  } catch {
    console.error('Admin database health check failed');
  }
  return {
    databaseAvailable,
    configuration: {
      database: Boolean(process.env.DATABASE_URL),
      clerk: Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      donations: Boolean(process.env.NEXT_PUBLIC_PAYPAL_DONATION_URL),
      orders: Boolean(process.env.NEXT_PUBLIC_ORDER_EMAIL),
      recipeKey: process.env.THEMEALDB_API_KEY && process.env.THEMEALDB_API_KEY !== '1' ? 'custom' : 'development',
    },
  };
}

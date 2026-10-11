import 'server-only';
import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdminUser } from './admin-policy';

// React cache deduplicates within a render; do not persist this across users.
export const getAccess = cache(async () => {
  const { userId } = await auth();
  if (!userId) return { userId: null, isAdmin: false };
  const user = await currentUser();
  return { userId, isAdmin: user?.id === userId && isAdminUser(user) };
});

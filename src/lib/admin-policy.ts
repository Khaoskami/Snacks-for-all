// This policy is evaluated only against the Clerk user fetched by the server.
const ADMIN_EMAIL = 'asadtitus@gmail.com';

type VerifiedUser = {
  primaryEmailAddress?: {
    emailAddress: string;
    verification?: { status: string } | null;
  } | null;
};

export function isAdminUser(user: VerifiedUser | null | undefined): boolean {
  const email = user?.primaryEmailAddress;
  return email?.verification?.status === 'verified'
    && email.emailAddress.trim().toLowerCase() === ADMIN_EMAIL;
}

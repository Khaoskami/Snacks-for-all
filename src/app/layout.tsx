import { ClerkProvider, UserButton, SignInButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import './globals.css';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  return (
    <html lang="en">
      <body className="bg-[#faf9f6] text-slate-800 font-sans min-h-screen">
        <ClerkProvider>
          <nav className="max-w-6xl mx-auto p-6 md:px-12 flex justify-between items-center">
            <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight">
              Snacks <span className="text-orange-500">for All</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/recipes" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-orange-500">Recipes</Link>
              <Link href="/shop" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-orange-500">Shop</Link>
              {userId ? (
                <>
                  <Link href="/account" className="text-sm font-medium text-slate-600 hover:text-orange-500">My account</Link>
                  <UserButton />
                </>
              ) : (
                <SignInButton mode="modal">
                  <button type="button" className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-medium hover:bg-orange-600 transition-colors">
                    Sign in
                  </button>
                </SignInButton>
              )}
            </div>
          </nav>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

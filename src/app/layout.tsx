import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import './globals.css';
import { UserButton } from '@clerk/nextjs';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          {/* Use fallbackRedirectUrl instead of afterSignOutUrl */}
          <UserButton fallbackRedirectUrl="/" />
        </nav>
        {children}
      </body>
    </html>
  );
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#faf9f6] text-slate-800 font-sans min-h-screen selection:bg-orange-200">
          
          {/* Global Navigation Bar */}
          <nav className="max-w-6xl mx-auto p-6 md:px-12 flex justify-between items-center">
            <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight hover:opacity-80 transition-opacity">
              Delicious <span className="text-orange-500">AI</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <SignedOut>
                <div className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-medium hover:bg-orange-600 transition-colors shadow-sm cursor-pointer">
                  <SignInButton mode="modal" />
                </div>
              </SignedOut>
              
              <SignedIn>
                <Link href="/upload" className="hidden md:block text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">
                  Upload Recipe
                </Link>
                {/* Clerk's built-in profile avatar dropdown */}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </nav>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
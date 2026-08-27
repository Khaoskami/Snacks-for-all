import { UserButton, ClerkProvider, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#faf9f6] text-slate-800 font-sans min-h-screen selection:bg-orange-500/30">
          {/* Global Navigation Bar */}
          <nav className="max-w-6xl mx-auto p-6 md:px-12 flex justify-between items-center">
            <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight">
              Delicious <span className="text-orange-500">AI</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <SignedOut>
                <div className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-medium">
                  <SignInButton mode="modal" />
                </div>
              </SignedOut>
              
              <SignedIn>
                <Link href="/upload" className="hidden md:block text-sm font-medium text-slate-600">
                  Upload Recipe
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
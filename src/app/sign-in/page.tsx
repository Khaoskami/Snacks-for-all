import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div>
        <Link href="/" className="block text-center text-sm text-slate-500 hover:text-orange-500 mb-6">← Back to Snacks for All</Link>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </main>
  );
}

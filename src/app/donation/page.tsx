import Link from 'next/link';

export default function DonationPage() {
  const donationUrl = process.env.NEXT_PUBLIC_PAYPAL_DONATION_URL;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-center">
      <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
      <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 mt-6">
        <div className="text-5xl">❤</div>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-5">Support Snacks for All</h1>
        <p className="mt-4 text-slate-500">Help keep the recipe and food tools running. Donations can be handled through your own PayPal donation page.</p>

        {donationUrl ? (
          <a href={donationUrl} target="_blank" rel="noreferrer" className="inline-block mt-8 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">Donate with PayPal ↗</a>
        ) : (
          <div className="mt-8 rounded-2xl bg-orange-50 border border-orange-100 p-5 text-left">
            <p className="font-semibold text-slate-800">Donation button setup</p>
            <p className="mt-2 text-sm text-slate-600">Create your PayPal donation page, then add its URL to Railway as NEXT_PUBLIC_PAYPAL_DONATION_URL.</p>
          </div>
        )}
      </div>
    </main>
  );
}

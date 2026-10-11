'use client';

import { useState } from 'react';
import { donationDetails } from '@/lib/donation-details';

export default function BankDetails() {
  const [message, setMessage] = useState('');
  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage('Copy is unavailable in this browser. Select the details below and copy them manually.');
    }
  }
  return (
    <section aria-labelledby="transfer-title" className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-5 md:p-6 text-left">
      <h2 id="transfer-title" className="text-xl font-bold text-slate-900">Donate by bank transfer</h2>
      <p className="mt-2 text-sm text-slate-600">Use these details in your banking app or internet banking.</p>
      <dl className="mt-5 divide-y divide-slate-200">
        {donationDetails.map(({ label, value }) => (
          <div key={label} className="py-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="mt-1 font-semibold text-slate-900 break-words select-text">{value}</dd>
            </div>
            <button type="button" onClick={() => copy(value, label)} aria-label={`Copy ${label.toLowerCase()}`} className="shrink-0 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500">Copy</button>
          </div>
        ))}
      </dl>
      <button type="button" onClick={() => copy(donationDetails.map(({ label, value }) => `${label}: ${value}`).join('\n'), 'All bank details')} className="mt-4 w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600">Copy all bank details</button>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-600">{message}</p>
      <p className="mt-3 text-sm text-slate-600">Please use <strong>Donation</strong> as your payment reference. Transfers are completed through your bank; this website does not process or automatically confirm payments.</p>
    </section>
  );
}

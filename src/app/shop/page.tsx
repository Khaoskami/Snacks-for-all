"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  nutriscore: string | null;
  stores: string;
  url: string;
};

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('snacks-for-all-cart');
      if (stored) setCart(JSON.parse(stored));
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('snacks-for-all-cart', JSON.stringify(cart));
  }, [cart]);

  const searchProducts = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const query = search.trim();
    if (!query) return;

    setLoading(true);
    setSearched(true);
    setError('');

    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Search failed');
      setProducts(data);
    } catch (searchError) {
      setProducts([]);
      setError(searchError instanceof Error ? searchError.message : 'Product search failed.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((current) => (current.some((item) => item.id === product.id) ? current : [...current, product]));
  };

  const removeFromCart = (id: string) => setCart((current) => current.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const orderEmail = process.env.NEXT_PUBLIC_ORDER_EMAIL;
  const orderMailto = useMemo(() => {
    if (!orderEmail || cart.length === 0) return '';
    const body = [
      'Hello,',
      '',
      'I would like to request the following food order:',
      '',
      ...cart.map((item, index) => `${index + 1}. ${item.name}${item.brand ? ` — ${item.brand}` : ''}\n${item.url}`),
      '',
      'Please confirm availability, pricing and delivery/pickup details.',
    ].join('\n');
    return `mailto:${encodeURIComponent(orderEmail)}?subject=${encodeURIComponent('Snacks for All food order request')}&body=${encodeURIComponent(body)}`;
  }, [cart, orderEmail]);

  return (
    <main className="max-w-6xl mx-auto px-6 pb-20">
      <div className="py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-orange-500">← Home</Link>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-5">Food shopping</h1>
        <p className="mt-3 text-slate-500 max-w-2xl">Search real food products, build a basket, and use the order-request button when your ordering email is configured.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <section>
          <form onSubmit={searchProducts} className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search food products e.g. oats" className="min-w-0 flex-1 px-4 py-3 rounded-xl outline-none" aria-label="Search food products" />
            <button type="submit" disabled={loading || !search.trim()} className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-50">{loading ? 'Searching…' : 'Search'}</button>
          </form>

          {error && <p className="mt-5 text-red-600">{error}</p>}
          {loading && <p className="py-10 text-slate-500 text-center">Finding products…</p>}

          {!loading && products.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              {products.map((product) => (
                <article key={product.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                  {product.image ? <img src={product.image} alt={product.name} className="w-full h-44 object-contain bg-white" /> : <div className="h-44 bg-slate-50 flex items-center justify-center text-4xl">🥫</div>}
                  <div className="p-5">
                    <h2 className="font-bold text-slate-900">{product.name}</h2>
                    {product.brand && <p className="text-sm text-slate-500 mt-1">{product.brand}</p>}
                    {product.nutriscore && <p className="text-xs text-slate-400 mt-2">Nutri-Score: {product.nutriscore.toUpperCase()}</p>}
                    <div className="flex gap-2 mt-4">
                      <button type="button" onClick={() => addToCart(product)} className="px-3 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">Add to basket</button>
                      <a href={product.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-orange-300">Product page ↗</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {searched && !loading && products.length === 0 && !error && <div className="mt-8 p-8 rounded-3xl bg-white border border-slate-200 text-center text-slate-500">No matching food products found. Try a simpler search.</div>}
          {!searched && <div className="mt-8 p-8 rounded-3xl bg-white border border-slate-200 text-slate-500">Start a product search above.</div>}
        </section>

        <aside className="bg-white border border-slate-200 rounded-3xl p-6 sticky top-6">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">Your basket</h2>
            <span className="text-sm text-slate-400">{cart.length} item{cart.length === 1 ? '' : 's'}</span>
          </div>

          <div className="mt-5 space-y-3">
            {cart.length === 0 ? <p className="text-sm text-slate-500">Add products from the search results.</p> : cart.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <button type="button" onClick={() => removeFromCart(item.id)} className="text-xs text-red-600">Remove</button>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-orange-600">Open product ↗</a>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {orderMailto ? (
              <a href={orderMailto} className="text-center px-4 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">Send order request</a>
            ) : (
              <p className="text-xs text-slate-500 bg-orange-50 rounded-xl p-3">Add NEXT_PUBLIC_ORDER_EMAIL in Railway to enable the order-request button.</p>
            )}
            <button type="button" onClick={clearCart} disabled={cart.length === 0} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40">Clear basket</button>
          </div>
        </aside>
      </div>
    </main>
  );
}

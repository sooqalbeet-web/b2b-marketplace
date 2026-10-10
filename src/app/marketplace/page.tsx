"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Cat = { slug: string; nameAr: string; nameEn: string };
type Factory = {
  id: string;
  name: string;
  region: string;
  description: string | null;
  verification: string;
  featured: boolean;
  categories: { category: Cat }[];
  certifications: { name: string; verified: boolean }[];
  _count: { products: number };
};

export default function MarketplacePage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ q: "", category: "", region: "", cert: "", verified: false });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories ?? []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (f.q) p.set("q", f.q);
      if (f.category) p.set("category", f.category);
      if (f.region) p.set("region", f.region);
      if (f.cert) p.set("cert", f.cert);
      if (f.verified) p.set("verified", "1");
      setLoading(true);
      fetch(`/api/factories?${p}`)
        .then((r) => r.json())
        .then((d) => setFactories(d.factories ?? []))
        .finally(() => setLoading(false));
    }, 250); // debounce typing
    return () => clearTimeout(t);
  }, [f]);

  const field = "rounded border p-2";

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">دليل المصانع</h1>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ابحث باسم المصنع أو التصنيف</label>
            <input className={`${field} w-full`} placeholder="مثال: أثاث، ألبان، شركة الوادي…" value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">أو اختر التصنيف</label>
            <select className={`${field} w-full`} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="">كل التصنيفات</option>
              {cats.map((c) => <option key={c.slug} value={c.slug}>{c.nameAr}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input className={field} placeholder="المنطقة" value={f.region}
            onChange={(e) => setF({ ...f, region: e.target.value })} />
          <input className={field} placeholder="الشهادة (مثل ISO 9001)" value={f.cert}
            onChange={(e) => setF({ ...f, cert: e.target.value })} />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={f.verified}
              onChange={(e) => setF({ ...f, verified: e.target.checked })} />
            المصانع الموثّقة فقط
          </label>
          {(f.q || f.category || f.region || f.cert || f.verified) && (
            <button type="button" className="ms-auto text-sm text-accent underline"
              onClick={() => setF({ q: "", category: "", region: "", cert: "", verified: false })}>مسح الفلاتر</button>
          )}
        </div>
      </div>

      {loading ? <p>جارٍ التحميل…</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {factories.map((x) => (
            <Link key={x.id} href={`/factories/${x.id}`}
              className="rounded-lg border p-4 hover:shadow">
              <div className="flex items-center justify-between">
                <b>{x.name}</b>
                {x.featured && <span className="text-xs text-accent">★ مميّز</span>}
              </div>
              <div className="text-sm text-gray-500">
                {x.region} · {x._count.products} منتج
                {x.verification === "VERIFIED" && " · ✓ موثّق"}
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-xs">
                {x.categories.map((c) => (
                  <span key={c.category.slug} className="rounded border px-2 py-0.5">{c.category.nameAr}</span>
                ))}
                {x.certifications.map((c) => (
                  <span key={c.name} className="rounded border border-green-600 px-2 py-0.5 text-green-700">
                    {c.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {factories.length === 0 && <p className="text-gray-500">لا توجد مصانع مطابقة. جرّب تغيير البحث أو التصنيف.</p>}
        </div>
      )}
    </div>
  );
}

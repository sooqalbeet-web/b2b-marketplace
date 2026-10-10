"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COUNTRIES, countryByCode, flagUrl } from "@/lib/countries";

type Cat = { slug: string; nameAr: string; nameEn: string };
type Factory = {
  id: string;
  name: string;
  country: string;
  region: string;
  description: string | null;
  verification: string;
  featured: boolean;
  categories: { category: Cat }[];
  certifications: { name: string; verified: boolean }[];
  _count: { products: number };
};

const EMPTY = { q: "", category: "", country: "", region: "", cert: "", verified: false };

export default function MarketplacePage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(EMPTY);   // what the user is typing / choosing
  const [applied, setApplied] = useState(EMPTY); // what was actually searched (updated by the search button)

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories ?? []));
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (applied.q) p.set("q", applied.q);
    if (applied.category) p.set("category", applied.category);
    if (applied.country) p.set("country", applied.country);
    if (applied.region) p.set("region", applied.region);
    if (applied.cert) p.set("cert", applied.cert);
    if (applied.verified) p.set("verified", "1");
    setLoading(true);
    fetch(`/api/factories?${p}`)
      .then((r) => r.json())
      .then((d) => setFactories(d.factories ?? []))
      .finally(() => setLoading(false));
  }, [applied]);

  const search = (e?: React.FormEvent) => { e?.preventDefault(); setApplied({ ...draft, q: draft.q.trim() }); };
  const clear = () => { setDraft(EMPTY); setApplied(EMPTY); };
  const dirty = JSON.stringify(applied) !== JSON.stringify(EMPTY);

  const field = "w-full rounded border p-2";
  const label = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">دليل المصانع</h1>

      <form onSubmit={search} className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={label}>اسم المصنع</label>
            <input className={field} placeholder="اكتب اسم المصنع…" value={draft.q}
              onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
          </div>
          <div>
            <label className={label}>التصنيف</label>
            <select className={field} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="">كل التصنيفات</option>
              {cats.map((c) => <option key={c.slug} value={c.slug}>{c.nameAr}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>الدولة</label>
            <select className={field} value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })}>
              <option value="">كل الدول</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.ar}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input className="rounded border p-2" placeholder="المنطقة / المدينة" value={draft.region}
            onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
          <input className="rounded border p-2" placeholder="الشهادة (مثل ISO 9001)" value={draft.cert}
            onChange={(e) => setDraft({ ...draft, cert: e.target.value })} />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={draft.verified} onChange={(e) => setDraft({ ...draft, verified: e.target.checked })} />
            المصانع الموثّقة فقط
          </label>
          <div className="ms-auto flex items-center gap-3">
            {(dirty || JSON.stringify(draft) !== JSON.stringify(EMPTY)) && (
              <button type="button" onClick={clear} className="text-sm text-accent underline">مسح الفلاتر</button>
            )}
            <button type="submit" className="rounded-lg bg-brand px-8 py-2 font-semibold text-white hover:bg-brand-dark">بحث</button>
          </div>
        </div>
      </form>

      {loading ? <p>جارٍ التحميل…</p> : (
        <>
          <p className="mb-3 text-sm text-gray-500">{factories.length} مصنع</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {factories.map((x) => {
              const c = countryByCode(x.country);
              return (
                <Link key={x.id} href={`/factories/${x.id}`} className="rounded-lg border bg-white p-4 hover:shadow">
                  <div className="flex items-center justify-between">
                    <b>{x.name}</b>
                    {x.featured && <span className="text-xs text-accent">★ مميّز</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    {c && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={flagUrl(x.country)} alt="" width={24} height={16} className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />
                        <span>{c.ar} ·</span>
                      </>
                    )}
                    <span>{x.region} · {x._count.products} منتج{x.verification === "VERIFIED" && " · ✓ موثّق"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-xs">
                    {x.categories.map((cc) => (
                      <span key={cc.category.slug} className="rounded border px-2 py-0.5">{cc.category.nameAr}</span>
                    ))}
                    {x.certifications.map((cc) => (
                      <span key={cc.name} className="rounded border border-green-600 px-2 py-0.5 text-green-700">{cc.name}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
            {factories.length === 0 && <p className="text-gray-500">لا توجد مصانع مطابقة. جرّب تغيير البحث أو التصنيف أو الدولة.</p>}
          </div>
        </>
      )}
    </div>
  );
}

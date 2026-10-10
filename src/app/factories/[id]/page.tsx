"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { countryByCode, flagUrl } from "@/lib/countries";

type Product = { id: string; name: string; sku: string; unit: string; moq: number; leadTimeDays: number | null };
type Factory = {
  id: string;
  name: string;
  description: string | null;
  country: string;
  region: string;
  address: string | null;
  website: string | null;
  capabilities: string | null;
  shippingReturnPolicy: string | null;
  verification: string;
  categories: { category: { slug: string; nameEn: string } }[];
  certifications: { id: string; name: string; issuer: string | null; verified: boolean; expiresAt: string | null }[];
  products: Product[];
};

export default function FactoryProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [factory, setFactory] = useState<Factory | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ productId: "", quantity: "", specs: "", targetPrice: "", deliveryDate: "" });

  useEffect(() => {
    fetch(`/api/factories/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setFactory(d.factory);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const selected = factory?.products.find((p) => p.id === form.productId);

  async function requestQuotation() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        factoryId: id,
        productId: form.productId || undefined,
        quantity: Number(form.quantity),
        specs: form.specs || undefined,
        targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
        deliveryDate: form.deliveryDate || undefined,
      }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    router.push(`/quotations/${d.quotation.id}`);
  }

  async function messageFactory() {
    const r = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factoryId: id }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    router.push(`/messages?c=${d.conversation.id}`);
  }

  if (!factory) return <p className="p-6">{error || "جارٍ التحميل…"}</p>;
  const field = "w-full rounded border p-2";

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">
        {factory.name} {factory.verification === "VERIFIED" && <span className="text-green-600">✓</span>}
      </h1>
      <p className="mb-4 flex flex-wrap items-center gap-2 text-gray-500">
        {countryByCode(factory.country) && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagUrl(factory.country)} alt="" width={24} height={16} className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />
            <span>{countryByCode(factory.country)!.ar} ·</span>
          </>
        )}
        <span>{factory.region}{factory.address ? ` · ${factory.address}` : ""}</span>
      </p>
      <button onClick={messageFactory} className="mb-4 rounded border border-brand px-4 py-2 text-brand">
        راسل المصنع
      </button>
      {factory.description && <p className="mb-4">{factory.description}</p>}
      <section className="mb-4 rounded-lg border-s-4 border-accent bg-white p-3">
        <h2 className="font-semibold">سياسة الشحن والإرجاع</h2>
        <p className="whitespace-pre-line text-sm">
          {factory.shippingReturnPolicy || "لم يحدّد المصنع سياسة بعد — اسأله مباشرة قبل الطلب."}
        </p>
        <p className="mt-1 text-xs text-gray-500">يشحن المصنع بنفسه، وهذه السياسة من المصنع وليست من المنصة.</p>
      </section>

      {factory.capabilities && (
        <section className="mb-4">
          <h2 className="font-semibold">القدرات الإنتاجية</h2>
          <p className="text-sm">{factory.capabilities}</p>
        </section>
      )}

      <section className="mb-4">
        <h2 className="mb-1 font-semibold">الشهادات</h2>
        {factory.certifications.length === 0 && <p className="text-sm text-gray-500">لا توجد شهادات.</p>}
        <div className="flex flex-wrap gap-2">
          {factory.certifications.map((c) => (
            <span key={c.id} className="rounded border px-2 py-1 text-sm">
              {c.name}{c.issuer ? ` · ${c.issuer}` : ""}{c.verified ? " ✓" : ""}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-1 font-semibold">المنتجات</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {factory.products.map((p) => (
            <button key={p.id} onClick={() => setForm({ ...form, productId: p.id, quantity: String(p.moq) })}
              className={`rounded border p-3 text-start ${form.productId === p.id ? "border-brand" : ""}`}>
              <b>{p.name}</b>
              <div className="text-sm text-gray-500">
                {p.sku} · الحد الأدنى {p.moq} {p.unit}{p.leadTimeDays ? ` · مدة التجهيز ${p.leadTimeDays} يوم` : ""}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="font-semibold">اطلب عرض سعر</h2>
        <input className={field} type="number" min={1}
          placeholder={selected ? `الكمية (الحد الأدنى ${selected.moq})` : "الكمية"}
          value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <textarea className={field} placeholder="المواصفات / المتطلبات" value={form.specs}
          onChange={(e) => setForm({ ...form, specs: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={field} type="number" placeholder="سعر الوحدة المستهدف (اختياري)" value={form.targetPrice}
            onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} />
          <input className={field} type="date" value={form.deliveryDate}
            onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button disabled={busy || !form.quantity} onClick={requestQuotation}
          className="rounded bg-brand px-4 py-2 text-white disabled:opacity-50">
          إرسال الطلب
        </button>
      </section>
    </div>
  );
}

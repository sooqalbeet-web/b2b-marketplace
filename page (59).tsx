"use client";

import { useCallback, useEffect, useState } from "react";

type Cat = { id: string; nameEn: string; nameAr: string };
type Product = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  moq: number;
  leadTimeDays: number | null;
  active: boolean;
  category: { nameAr: string };
  inventory: { currentQuantity: number } | null;
};

const EMPTY = { name: "", sku: "", categoryId: "", unit: "pcs", moq: "1", leadTimeDays: "", description: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/factory/products");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setProducts(d.products);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories ?? []));
  }, [load]);

  async function create() {
    setError("");
    const r = await fetch("/api/factory/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        moq: Number(form.moq),
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
      }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setForm(EMPTY);
    setShow(false);
    load();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError("");
    const r = await fetch(`/api/factory/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error);
    load();
  }

  function editMoq(p: Product) {
    const v = prompt("الحد الأدنى الجديد للطلب", String(p.moq));
    if (v) patch(p.id, { moq: Number(v) });
  }

  const field = "w-full rounded border p-2";

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">المنتجات</h1>
        <button className="rounded bg-brand px-4 py-2 text-white" onClick={() => setShow(!show)}>
          {show ? "إغلاق" : "إضافة منتج"}
        </button>
      </div>

      {show && (
        <div className="mb-6 grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
          <input className={field} placeholder="الاسم" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={field} placeholder="رمز المنتج SKU (لا يمكن تغييره لاحقاً)" value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <select className={field} value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">التصنيف…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
          <input className={field} placeholder="الوحدة (قطعة، كجم، م²…)" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input className={field} type="number" min={1} placeholder="الحد الأدنى للطلب" value={form.moq}
            onChange={(e) => setForm({ ...form, moq: e.target.value })} />
          <input className={field} type="number" min={1} placeholder="مدة التجهيز (أيام)" value={form.leadTimeDays}
            onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })} />
          <textarea className={`${field} sm:col-span-2`} placeholder="الوصف" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="rounded bg-brand px-4 py-2 text-white disabled:opacity-50 sm:col-span-2"
            disabled={!form.name || !form.sku || !form.categoryId} onClick={create}>إنشاء المنتج</button>
        </div>
      )}

      {error && <p className="mb-3 text-red-600">{error}</p>}

      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="p-2">المنتج</th><th className="p-2">التصنيف</th><th className="p-2">الحد الأدنى</th>
            <th className="p-2">مدة التجهيز</th><th className="p-2">المخزون</th><th className="p-2">الحالة</th><th />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={`border-b ${p.active ? "" : "opacity-50"}`}>
              <td className="p-2"><b>{p.name}</b><div className="text-gray-500">{p.sku}</div></td>
              <td className="p-2">{p.category.nameAr}</td>
              <td className="p-2">{p.moq} {p.unit}</td>
              <td className="p-2">{p.leadTimeDays ? `${p.leadTimeDays} يوم` : "—"}</td>
              <td className="p-2">{p.inventory?.currentQuantity ?? 0}</td>
              <td className="p-2">{p.active ? "ظاهر" : "مخفي"}</td>
              <td className="space-x-3 p-2">
                <button className="text-brand" onClick={() => editMoq(p)}>الحد الأدنى</button>
                <button className="text-brand" onClick={() => patch(p.id, { active: !p.active })}>
                  {p.active ? "إخفاء" : "إظهار"}
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan={7} className="p-4 text-gray-500">لا توجد منتجات بعد.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

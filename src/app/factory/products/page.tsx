"use client";

import { useCallback, useEffect, useState } from "react";
import ImageRules from "@/components/ImageRules";
import { compressImage } from "@/lib/image-compress";
import { thumb } from "@/lib/img";
import { MAX_IMAGES_PER_FACTORY as MAX_IMG } from "@/lib/limits";

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
  imageUrls: string[] | null;
};

const EMPTY = { name: "", sku: "", categoryId: "", unit: "pcs", moq: "1", leadTimeDays: "", description: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const usedImages = products.reduce((n, p) => n + (p.imageUrls?.length ?? 0), 0); // images already used by the whole factory

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

  async function upload(file: File | undefined): Promise<string | null> {
    if (!file) return null;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", await compressImage(file));
    const r = await fetch("/api/uploads", { method: "POST", body: fd });
    const d = await r.json();
    setUploading(false);
    if (!r.ok) { setError(d.error); return null; }
    return d.url as string;
  }

  async function create() {
    setError("");
    const r = await fetch("/api/factory/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        moq: Number(form.moq),
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        imageUrls: images,
      }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setForm(EMPTY);
    setImages([]);
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
          <div className="sm:col-span-2"><ImageRules /></div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">صور المنتج — المستخدم في المصنع: {usedImages + images.length} من {MAX_IMG} صور (PNG أو JPEG أو WebP، وتُضغط الصورة تلقائياً قبل الرفع)</label>
            <div className="flex flex-wrap items-center gap-2">
              {images.map((u) => (
                <div key={u} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(u, 160)} alt="" className="h-16 w-16 rounded border object-cover" />
                  <button type="button" onClick={() => setImages(images.filter((x) => x !== u))}
                    className="absolute -end-1 -top-1 h-5 w-5 rounded-full bg-accent text-xs text-white">×</button>
                </div>
              ))}
              {usedImages + images.length < MAX_IMG && (
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed text-2xl text-gray-400 hover:bg-gray-50">
                  {uploading ? "…" : "+"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading}
                    onChange={async (e) => {
                      const url = await upload(e.target.files?.[0]);
                      e.target.value = "";
                      if (url) setImages((prev) => [...prev, url].slice(0, Math.max(0, MAX_IMG - usedImages)));
                    }} />
                </label>
              )}
            </div>
          </div>
          <button className="rounded bg-brand px-4 py-2 text-white disabled:opacity-50 sm:col-span-2"
            disabled={uploading || !form.name || !form.sku || !form.categoryId} onClick={create}>إنشاء المنتج</button>
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
              <td className="p-2">
                <div className="flex items-center gap-2">
                  {p.imageUrls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb(p.imageUrls[0], 120)} alt="" className="h-10 w-10 rounded border object-cover" />
                  )}
                  <div><b>{p.name}</b><div className="text-gray-500">{p.sku}</div></div>
                </div>
              </td>
              <td className="p-2">{p.category.nameAr}</td>
              <td className="p-2">{p.moq} {p.unit}</td>
              <td className="p-2">{p.leadTimeDays ? `${p.leadTimeDays} يوم` : "—"}</td>
              <td className="p-2">{p.inventory?.currentQuantity ?? 0}</td>
              <td className="p-2">{p.active ? "ظاهر" : "مخفي"}</td>
              <td className="space-x-3 p-2">
                <button className="text-brand" onClick={() => editMoq(p)}>الحد الأدنى</button>
                {usedImages < MAX_IMG && (
                  <label className="cursor-pointer text-brand">
                    إضافة صورة
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading}
                      onChange={async (e) => {
                        const url = await upload(e.target.files?.[0]);
                        e.target.value = "";
                        if (url) patch(p.id, { imageUrls: [...(p.imageUrls ?? []), url] });
                      }} />
                  </label>
                )}
                {(p.imageUrls?.length ?? 0) > 0 && (
                  <button className="text-brand" onClick={() => patch(p.id, { imageUrls: [] })}>حذف الصور</button>
                )}
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

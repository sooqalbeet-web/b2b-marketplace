"use client";

import { label } from "@/lib/labels";
import { useCallback, useEffect, useState } from "react";

type Item = { id: string; name: string; sku: string; unit: string; onHand: number; reserved: number; available: number };
type Tx = { id: string; type: string; quantity: number; reference: string | null; note: string | null; createdAt: string; product: { name: string } };

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ delta: "", note: "" });

  const load = useCallback(async () => {
    const r = await fetch("/api/factory/inventory");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setItems(d.items);
    setTxs(d.transactions);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function adjust(productId: string) {
    const r = await fetch(`/api/factory/inventory/${productId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: Number(form.delta), note: form.note }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setError("");
    setOpen(null);
    setForm({ delta: "", note: "" });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">المخزون — البضاعة الجاهزة</h1>
      {error && <p className="mb-3 text-red-600">{error}</p>}

      <table className="mb-8 w-full text-start text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="p-2">المنتج</th><th className="p-2">المتوفر</th>
            <th className="p-2">المحجوز</th><th className="p-2">القابل للبيع</th><th />
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b align-top">
              <td className="p-2"><b>{i.name}</b><div className="text-gray-500">{i.sku}</div></td>
              <td className="p-2">{i.onHand} {i.unit}</td>
              <td className="p-2">{i.reserved}</td>
              <td className={`p-2 ${i.available <= 0 ? "font-bold text-red-600" : ""}`}>{i.available}</td>
              <td className="p-2">
                {open === i.id ? (
                  <div className="flex flex-wrap gap-1">
                    <input className="w-24 rounded border p-1" type="number" placeholder="± الكمية" value={form.delta}
                      onChange={(e) => setForm({ ...form, delta: e.target.value })} />
                    <input className="w-40 rounded border p-1" placeholder="السبب (مطلوب)" value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })} />
                    <button className="rounded bg-brand px-2 text-white" onClick={() => adjust(i.id)}>حفظ</button>
                    <button className="px-1 text-gray-500" onClick={() => setOpen(null)}>✕</button>
                  </div>
                ) : (
                  <button className="text-brand" onClick={() => setOpen(i.id)}>تعديل</button>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">لا توجد منتجات بعد.</td></tr>}
        </tbody>
      </table>

      <h2 className="mb-2 text-lg font-semibold">سجل الحركات</h2>
      {txs.map((t) => (
        <div key={t.id} className="flex items-center justify-between border-b py-2 text-sm">
          <span>
            <b>{label(t.type)}</b> <span className={t.type === "STOCK_OUT" || t.quantity < 0 ? "text-red-600" : "text-green-600"}>
              {t.type === "STOCK_OUT" ? "−" : t.quantity > 0 ? "+" : ""}{Math.abs(t.quantity)}
            </span>{" "}
            · {t.product.name}
            {t.reference && <span className="text-gray-500"> · {t.reference}</span>}
            {t.note && <div className="text-gray-500">{t.note}</div>}
          </span>
          <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString("ar-u-nu-latn")}</span>
        </div>
      ))}
      {txs.length === 0 && <p className="text-gray-500">لا توجد حركات بعد.</p>}
    </div>
  );
}

"use client";

import { label } from "@/lib/labels";
import { useCallback, useEffect, useState } from "react";

type Inspection = {
  id: string;
  inspectionNumber: string;
  status: string;
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  product: { name: string } | null;
  productionOrder: { productionNumber: string };
};

export default function QualityPage() {
  const [items, setItems] = useState<Inspection[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ passed: "", failed: "0", reason: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/factory/quality");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setItems(d.inspections);
  }, []);

  useEffect(() => { load(); }, [load]);

  const count = (s: string) => items.filter((i) => i.status === s).length;
  const shown = items.filter((i) => filter === "ALL" || i.status === filter);

  function openForm(i: Inspection) {
    setOpen(i.id);
    setForm({ passed: String(i.inspectedQuantity), failed: "0", reason: "" });
    setError("");
  }

  async function submit(i: Inspection) {
    const r = await fetch(`/api/factory/quality/${i.id}/inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passedQuantity: Number(form.passed),
        failedQuantity: Number(form.failed),
        failureReason: form.reason || undefined,
      }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setOpen(null);
    load();
  }

  const field = "rounded border p-2";

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">مراقبة الجودة</h1>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {["PENDING", "PASSED", "FAILED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="rounded-lg border p-3 text-start">
            <div className="text-2xl font-bold">{count(s)}</div>
            <div className="text-sm text-gray-500">{label(s)}</div>
          </button>
        ))}
      </div>
      <button className="mb-3 text-sm text-brand" onClick={() => setFilter("ALL")}>عرض الكل</button>

      {shown.map((i) => (
        <div key={i.id} className="mb-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div>
              <b>{i.inspectionNumber}</b> · {i.product?.name ?? "مخصص"}
              <div className="text-sm text-gray-500">
                {i.productionOrder.productionNumber} · تم فحص {i.inspectedQuantity}
                {i.status !== "PENDING" && ` · ناجح ${i.passedQuantity} / راسب ${i.failedQuantity}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border px-2 py-0.5 text-xs">{label(i.status)}</span>
              {i.status === "PENDING" && open !== i.id && (
                <button className="rounded bg-brand px-3 py-1 text-white" onClick={() => openForm(i)}>فحص</button>
              )}
            </div>
          </div>

          {open === i.id && (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-sm">الناجح<br />
                <input className={field} type="number" min={0} value={form.passed}
                  onChange={(e) => setForm({ ...form, passed: e.target.value })} /></label>
              <label className="text-sm">الراسب<br />
                <input className={field} type="number" min={0} value={form.failed}
                  onChange={(e) => setForm({ ...form, failed: e.target.value })} /></label>
              <label className="flex-1 text-sm">سبب الرفض<br />
                <input className={`${field} w-full`} value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
              <button className="rounded bg-brand px-4 py-2 text-white" onClick={() => submit(i)}>إرسال نتيجة الفحص</button>
              <button className="px-2 py-2 text-gray-500" onClick={() => setOpen(null)}>إلغاء</button>
            </div>
          )}
        </div>
      ))}
      {error && <p className="text-red-600">{error}</p>}
      {shown.length === 0 && <p className="text-gray-500">لا توجد عمليات فحص.</p>}
    </div>
  );
}

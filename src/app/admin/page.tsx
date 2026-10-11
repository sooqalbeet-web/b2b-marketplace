"use client";

import { useCallback, useEffect, useState } from "react";

type F = {
  id: string; name: string; region: string; description: string | null; address: string | null;
  commercialRegNo: string | null; taxNo: string | null;
  user: { name: string; email: string; phone: string | null };
  certifications: { id: string; name: string; issuer: string | null; fileUrl: string | null }[];
};

export default function AdminPage() {
  const [rows, setRows] = useState<F[]>([]);
  const [error, setError] = useState("");
  const [tool, setTool] = useState("");
  const [demo, setDemo] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/factories?status=PENDING");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setRows(d.factories);
  }, []);
  const loadDemo = useCallback(async () => {
    const r = await fetch("/api/admin/demo-factories");
    if (r.ok) setDemo((await r.json()).factories);
  }, []);
  useEffect(() => { load(); loadDemo(); }, [load, loadDemo]);

  async function syncCategories() {
    setTool("");
    const r = await fetch("/api/admin/categories/sync", { method: "POST" });
    const d = await r.json();
    setTool(r.ok ? `تم تحديث التصنيفات. العدد الكلي الآن: ${d.total}` : d.error);
  }

  async function deleteDemo() {
    if (!confirm(`سيتم حذف ${demo.length} مصانع تجريبية نهائياً مع منتجاتها وحساباتها. متابعة؟`)) return;
    setTool("");
    const r = await fetch("/api/admin/demo-factories", { method: "POST" });
    const d = await r.json();
    setTool(r.ok ? `تم حذف ${d.deleted} مصنع تجريبي.` : d.error);
    loadDemo();
  }

  async function review(id: string, action: "APPROVE" | "REJECT") {
    const r = await fetch(`/api/admin/factories/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">طلبات توثيق المصانع</h1>
      {error && <p className="text-red-600">{error}</p>}
      {rows.length === 0 && <p className="text-gray-500">لا توجد مصانع بانتظار المراجعة.</p>}
      <div className="space-y-3">
        {rows.map((f) => (
          <div key={f.id} className="rounded-lg border bg-white p-4">
            <div className="font-semibold">{f.name} <span className="text-sm font-normal text-gray-500">· {f.region}</span></div>
            <div className="text-sm text-gray-500">{f.user.name} — {f.user.email} — <span dir="ltr">{f.user.phone}</span></div>
            <div className="text-sm">السجل: <b dir="ltr">{f.commercialRegNo ?? "—"}</b> · الرقم الضريبي: <b dir="ltr">{f.taxNo ?? "—"}</b></div>
            <p className="mt-2 text-sm">{f.description}</p>
            <p className="text-sm text-gray-500">{f.address}</p>
            <ul className="mt-2 text-sm">
              {f.certifications.map((c) => (
                <li key={c.id}>
                  {c.name}{c.issuer ? ` (${c.issuer})` : ""}{" "}
                  {c.fileUrl && <a href={c.fileUrl} target="_blank" className="text-brand underline">المستند</a>}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button onClick={() => review(f.id, "APPROVE")} className="rounded bg-green-600 px-3 py-1 text-white">اعتماد</button>
              <button onClick={() => review(f.id, "REJECT")} className="rounded border px-3 py-1">رفض</button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">أدوات الإدارة</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={syncCategories} className="rounded bg-brand px-4 py-2 text-white">تحديث قائمة التصنيفات</button>
          {demo.length > 0 && (
            <button onClick={deleteDemo} className="rounded border border-accent px-4 py-2 text-accent">حذف المصانع التجريبية ({demo.length})</button>
          )}
        </div>
        {demo.length > 0 && <p className="mt-2 text-xs text-gray-500">المصانع التجريبية: {demo.map((d) => d.name).join("، ")}</p>}
        {tool && <p className="mt-2 text-sm text-brand">{tool}</p>}
      </section>
    </div>
  );
}

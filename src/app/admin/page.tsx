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

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/factories?status=PENDING");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setRows(d.factories);
  }, []);
  useEffect(() => { load(); }, [load]);

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
    </div>
  );
}

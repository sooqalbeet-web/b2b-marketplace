"use client";

import { label } from "@/lib/labels";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  number: string;
  status: string;
  quantity: number;
  updatedAt: string;
  product: { name: string } | null;
  offers: { fromRole: string; unitPrice: string }[];
};

const STATUSES = ["ALL", "SENT", "QUOTED", "NEGOTIATION", "ACCEPTED", "REJECTED"];

export default function FactoryQuotationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = status === "ALL" ? "" : `?status=${status}`;
    fetch(`/api/quotations${qs}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setRows(d.quotations);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">عروض الأسعار</h1>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[["جديدة", "SENT"], ["قيد التفاوض", "NEGOTIATION"], ["مقبولة", "ACCEPTED"]].map(([l, s]) => (
          <div key={s} className="rounded-lg border p-3">
            <div className="text-2xl font-bold">{count(s)}</div>
            <div className="text-sm text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="mb-4 rounded border p-2"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
      </select>

      {error && <p className="text-red-600">{error}</p>}
      {loading ? <p>جارٍ التحميل…</p> : (
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="p-2">الرقم</th><th className="p-2">المنتج</th>
              <th className="p-2">الكمية</th><th className="p-2">آخر عرض</th>
              <th className="p-2">الحالة</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-b">
                <td className="p-2 font-medium">{q.number}</td>
                <td className="p-2">{q.product?.name ?? "مخصص"}</td>
                <td className="p-2">{q.quantity}</td>
                <td className="p-2">
                  {q.offers[0] ? `${q.offers[0].unitPrice} (${label(q.offers[0].fromRole)})` : "—"}
                </td>
                <td className="p-2">{label(q.status)}</td>
                <td className="p-2">
                  <Link href={`/quotations/${q.id}`} className="text-brand">فتح</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-gray-500">لا توجد عروض أسعار.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

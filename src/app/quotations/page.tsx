"use client";

import Link from "next/link";
import { label } from "@/lib/labels";
import { useEffect, useState } from "react";

type Row = {
  id: string; number: string; status: string; quantity: number; updatedAt: string;
  product: { name: string } | null; factory: { name: string };
  offers: { fromRole: string; unitPrice: string }[];
};

export default function ClientQuotationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/quotations")
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setRows(d.quotations); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">طلبات عروض الأسعار الخاصة بي</h1>
      {error && <p className="text-red-600">{error}</p>}
      {rows.length === 0 && !error && (
        <p className="text-gray-500">لا شيء بعد. <Link href="/marketplace" className="text-brand underline">اعثر على مصنع</Link> واطلب عرض سعر.</p>
      )}
      <div className="space-y-2">
        {rows.map((q) => (
          <Link key={q.id} href={`/quotations/${q.id}`} className="flex items-center justify-between rounded-lg border bg-white p-3 hover:bg-gray-50">
            <div>
              <div className="font-medium">{q.number} · {q.factory.name}</div>
              <div className="text-sm text-gray-500">{q.product?.name ?? "منتج مخصص"} · {q.quantity} وحدة</div>
            </div>
            <div className="text-end text-sm">
              <div className="rounded bg-gray-100 px-2 py-0.5">{label(q.status)}</div>
              {q.offers[0] && <div className="mt-1 text-gray-500">آخر عرض: {q.offers[0].unitPrice}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

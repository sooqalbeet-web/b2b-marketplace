"use client";

import { label } from "@/lib/labels";
import Link from "next/link";
import { useEffect, useState } from "react";

type Data = {
  factoryName: string;
  verification: string;
  stats: {
    newRequests: number;
    negotiating: number;
    acceptedQuotations: number;
    activeOrders: number;
    inProduction: number;
    unreadMessages: number;
    monthRevenue: number;
    outOfStock: number;
  };
  needsResponse: { id: string; number: string; status: string; client: string; product: string; quantity: number }[];
  recentOrders: { id: string; number: string; status: string; totalPrice: string; createdAt: string }[];
};

const NAV = [
  ["عروض الأسعار", "/factory/quotations"],
  ["الرسائل", "/messages"],
  ["الجودة", "/factory/quality"],
  ["المخزون", "/factory/inventory"],
];

export default function FactoryDashboard() {
  const [d, setD] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/factory/dashboard")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setD(j);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (!d) return <p className="p-6">{error || "جارٍ التحميل…"}</p>;
  const s = d.stats;

  const cards: [string, string | number, string?][] = [
    ["طلبات جديدة", s.newRequests, "/factory/quotations"],
    ["قيد التفاوض", s.negotiating, "/factory/quotations"],
    ["طلبات نشطة", s.activeOrders],
    ["قيد الإنتاج", s.inProduction],
    ["رسائل غير مقروءة", s.unreadMessages, "/messages"],
    ["نفد من المخزون", s.outOfStock, "/factory/inventory"],
    ["إيرادات هذا الشهر", s.monthRevenue.toLocaleString("ar-u-nu-latn")],
  ];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{d.factoryName}</h1>
        <nav className="flex gap-2 text-sm">
          {NAV.map(([l, h]) => (
            <Link key={h} href={h} className="rounded border px-3 py-1">{l}</Link>
          ))}
        </nav>
      </div>

      {d.verification !== "VERIFIED" && (
        <p className="mb-4 rounded border border-amber-600 p-3 text-sm text-amber-700">
          مصنعك غير موثّق بعد. ارفع شهاداتك ليظهر كمصنع موثّق في السوق.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([label, value, href]) => {
          const inner = (
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          );
          return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>;
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">بانتظار ردّك</h2>
          {d.needsResponse.length === 0 && <p className="text-sm text-gray-500">لا شيء بانتظارك.</p>}
          {d.needsResponse.map((x) => (
            <Link key={x.id} href={`/quotations/${x.id}`}
              className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <span><b>{x.number}</b> · {x.client}<br />
                <span className="text-gray-500">{x.product} × {x.quantity}</span></span>
              <span className="text-xs">{label(x.status)}</span>
            </Link>
          ))}
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">أحدث الطلبات</h2>
          {d.recentOrders.length === 0 && <p className="text-sm text-gray-500">لا توجد طلبات بعد.</p>}
          {d.recentOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <span><b>{o.number}</b><br />
                <span className="text-gray-500">{new Date(o.createdAt).toLocaleDateString("ar-u-nu-latn")}</span></span>
              <span className="text-end">{Number(o.totalPrice).toLocaleString("ar-u-nu-latn")}<br />
                <span className="text-xs">{label(o.status)}</span></span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

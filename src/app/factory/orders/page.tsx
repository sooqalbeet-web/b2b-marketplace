"use client";

import { label } from "@/lib/labels";
import { useCallback, useEffect, useState } from "react";

type Order = {
  id: string;
  number: string;
  status: string;
  quantity: number;
  totalPrice: string;
  product: { name: string } | null;
  client: { name: string };
  production: { id: string; productionNumber: string; status: string; plannedQuantity: number; producedQuantity: number } | null;
};

export default function FactoryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/factory/orders");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setOrders(d.orders);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function post(url: string, body?: unknown) {
    setError("");
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json();
    if (!r.ok) setError(d.error);
    await load();
  }

  function recordOutput(o: Order) {
    const p = o.production!;
    const v = prompt(`عدد الوحدات المنتجة الآن (المتبقي ${p.plannedQuantity - p.producedQuantity})`);
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) return;
    post(`/api/factory/production/${p.id}/output`, { producedQuantity: n });
  }

  function ship(o: Order) {
    const carrier = prompt("شركة الشحن (اختياري)") ?? "";
    const trackingNumber = prompt("رقم التتبع (اختياري)") ?? "";
    post(`/api/factory/orders/${o.id}/ship`, { carrier, trackingNumber });
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">الطلبات</h1>
      {error && <p className="mb-3 text-red-600">{error}</p>}
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="p-2">الطلب</th><th className="p-2">المشتري</th><th className="p-2">المنتج</th>
            <th className="p-2">الكمية</th><th className="p-2">الإنتاج</th><th className="p-2">الحالة</th><th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="p-2 font-medium">{o.number}</td>
              <td className="p-2">{o.client.name}</td>
              <td className="p-2">{o.product?.name ?? "مخصص"}</td>
              <td className="p-2">{o.quantity}</td>
              <td className="p-2">
                {o.production ? `${o.production.producedQuantity} / ${o.production.plannedQuantity}` : "—"}
              </td>
              <td className="p-2">{label(o.status)}</td>
              <td className="p-2">
                {o.status === "CONFIRMED" && (
                  <button className="rounded bg-brand px-3 py-1 text-white"
                    onClick={() => post(`/api/factory/orders/${o.id}/production`)}>بدء الإنتاج</button>
                )}
                {o.status === "READY_TO_SHIP" && (
                  <button className="rounded bg-green-600 px-3 py-1 text-white"
                    onClick={() => ship(o)}>شحن</button>
                )}
                {o.status === "IN_PRODUCTION" && o.production && (
                  <button className="rounded border border-brand px-3 py-1 text-brand"
                    onClick={() => recordOutput(o)}>تسجيل الإنتاج</button>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={7} className="p-4 text-gray-500">لا توجد طلبات بعد.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

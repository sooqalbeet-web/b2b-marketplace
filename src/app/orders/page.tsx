"use client";

import { label } from "@/lib/labels";
import { useCallback, useEffect, useState } from "react";

type Order = {
  id: string;
  number: string;
  status: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  factory: { name: string };
  product: { name: string } | null;
  shipment: { carrier: string | null; trackingNumber: string | null; deliveredAt: string | null } | null;
};

const STEPS = ["CONFIRMED", "IN_PRODUCTION", "QC", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/orders");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setOrders(d.orders);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function confirmDelivery(id: string) {
    const r = await fetch(`/api/orders/${id}/deliver`, { method: "POST" });
    const d = await r.json();
    if (!r.ok) setError(d.error);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">طلباتي</h1>
      {error && <p className="mb-3 text-red-600">{error}</p>}

      {orders.map((o) => {
        const step = STEPS.indexOf(o.status);
        return (
          <div key={o.id} className="mb-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <b>{o.number}</b> · {o.factory.name}
                <div className="text-sm text-gray-500">
                  {o.product?.name ?? "مخصص"} × {o.quantity} · الإجمالي {Number(o.totalPrice).toLocaleString("ar-u-nu-latn")}
                </div>
              </div>
              {o.status === "SHIPPED" && (
                <button className="rounded bg-green-600 px-3 py-2 text-white" onClick={() => confirmDelivery(o.id)}>
                  تأكيد الاستلام
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex-1">
                  <div className={`h-1.5 rounded ${i <= step ? "bg-brand" : "bg-gray-300"}`} />
                  <div className={`mt-1 text-[10px] ${i === step ? "font-bold" : "text-gray-500"}`}>
                    {label(s)}
                  </div>
                </div>
              ))}
            </div>

            {o.shipment && (
              <p className="mt-2 text-sm text-gray-600">
                تم الشحن{o.shipment.carrier ? ` عبر ${o.shipment.carrier}` : ""}
                {o.shipment.trackingNumber ? ` · رقم التتبع ${o.shipment.trackingNumber}` : ""}
                {o.shipment.deliveredAt ? ` · تم التسليم ${new Date(o.shipment.deliveredAt).toLocaleDateString("ar-u-nu-latn")}` : ""}
              </p>
            )}
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-gray-500">لا توجد طلبات بعد.</p>}
    </div>
  );
}

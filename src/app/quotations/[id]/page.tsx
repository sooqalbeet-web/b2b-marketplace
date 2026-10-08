"use client";

import { label } from "@/lib/labels";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Offer = {
  id: string;
  fromRole: "CLIENT" | "FACTORY";
  unitPrice: string;
  quantity: number;
  leadTimeDays: number | null;
  paymentTerms: string | null;
  shippingTerms: string | null;
  note: string | null;
  createdAt: string;
};

type Q = {
  id: string;
  number: string;
  status: string;
  quantity: number;
  specs: string | null;
  targetPrice: string | null;
  product: { name: string; sku: string } | null;
  factory: { name: string; region: string };
  client: { name: string };
  offers: Offer[];
  order: { id: string; number: string } | null;
};

export default function NegotiationRoom() {
  const { id } = useParams<{ id: string }>();
  const [q, setQ] = useState<Q | null>(null);
  const [party, setParty] = useState<"CLIENT" | "FACTORY">("CLIENT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    unitPrice: "", quantity: "", leadTimeDays: "", paymentTerms: "", shippingTerms: "", note: "",
  });

  const load = useCallback(async () => {
    const r = await fetch(`/api/quotations/${id}`);
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setQ(d.quotation);
    setParty(d.party);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function call(path: string, body: unknown) {
    setBusy(true);
    setError("");
    const r = await fetch(`/api/quotations/${id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    await load();
    return d;
  }

  async function sendOffer() {
    const num = (v: string) => (v ? Number(v) : undefined);
    const d = await call("offer", {
      unitPrice: num(form.unitPrice),
      quantity: num(form.quantity),
      leadTimeDays: num(form.leadTimeDays),
      paymentTerms: form.paymentTerms || undefined,
      shippingTerms: form.shippingTerms || undefined,
      note: form.note || undefined,
    });
    if (d) setForm({ unitPrice: "", quantity: "", leadTimeDays: "", paymentTerms: "", shippingTerms: "", note: "" });
  }

  if (!q) return <p className="p-6">{error || "Loading…"}</p>;

  const last = q.offers[q.offers.length - 1];
  const open = ["SENT", "RECEIVED", "QUOTED", "NEGOTIATION"].includes(q.status);
  const myTurnToOffer =
    open && last?.fromRole !== party && !(party === "CLIENT" && !last);
  const canAccept = open && !!last && last.fromRole !== party;
  const input = "w-full rounded border p-2";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{q.number}</h1>
          <p className="text-gray-500">
            {q.product?.name ?? "طلب مخصص"} · {q.quantity} وحدة ·{" "}
            {party === "CLIENT" ? q.factory.name : q.client.name}
          </p>
        </div>
        <span className="rounded-full border px-3 py-1 text-sm">{label(q.status)}</span>
      </div>

      {q.specs && <p className="mb-4 rounded border p-3 text-sm">{q.specs}</p>}
      {error && <p className="mb-3 text-red-600">{error}</p>}

      <div className="mb-6 space-y-3">
        {q.offers.length === 0 && (
          <p className="text-gray-500">
            {party === "FACTORY" ? "أرسل عرض السعر الأول." : "بانتظار عرض سعر المصنع."}
          </p>
        )}
        {q.offers.map((o) => (
          <div
            key={o.id}
            className={`max-w-[85%] rounded-lg border p-3 ${o.fromRole === party ? "ms-auto" : ""}`}
          >
            <div className="flex justify-between text-xs text-gray-500">
              <span>{o.fromRole === party ? "أنت" : label(o.fromRole)}</span>
              <span>{new Date(o.createdAt).toLocaleString("ar-u-nu-latn")}</span>
            </div>
            <div className="text-lg font-bold">{o.unitPrice} / وحدة × {o.quantity}</div>
            <div className="text-sm text-gray-600">
              {o.leadTimeDays ? `مدة التجهيز ${o.leadTimeDays} يوم · ` : ""}
              {o.paymentTerms ? `الدفع: ${o.paymentTerms} · ` : ""}
              {o.shippingTerms ? `الشحن: ${o.shippingTerms}` : ""}
            </div>
            {o.note && <p className="mt-1 text-sm">{o.note}</p>}
          </div>
        ))}
      </div>

      {q.order && (
        <p className="mb-4 rounded border border-green-600 p-3 text-green-700">
          تم القبول — أُنشئ الطلب {q.order.number}.
        </p>
      )}

      {canAccept && (
        <div className="mb-4 flex gap-2">
          <button disabled={busy} onClick={() => call("respond", { action: "ACCEPT" })}
            className="rounded bg-green-600 px-4 py-2 text-white">قبول العرض</button>
          <button disabled={busy} onClick={() => confirm("هل تريد رفض عرض السعر هذا؟") && call("respond", { action: "REJECT" })}
            className="rounded border border-red-600 px-4 py-2 text-red-600">رفض</button>
        </div>
      )}

      {myTurnToOffer && (
        <div className="space-y-2 rounded-lg border p-4">
          <h2 className="font-semibold">{last ? "عرض مقابل" : "إرسال عرض السعر"}</h2>
          <div className="grid grid-cols-3 gap-2">
            <input className={input} type="number" placeholder="سعر الوحدة" value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
            <input className={input} type="number" placeholder={`الكمية (${q.quantity})`} value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <input className={input} type="number" placeholder="مدة التجهيز (أيام)" value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={input} placeholder="شروط الدفع" value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
            <input className={input} placeholder="شروط الشحن" value={form.shippingTerms}
              onChange={(e) => setForm({ ...form, shippingTerms: e.target.value })} />
          </div>
          <textarea className={input} placeholder="ملاحظة" value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button disabled={busy || !form.unitPrice} onClick={sendOffer}
            className="rounded bg-brand px-4 py-2 text-white disabled:opacity-50">إرسال</button>
        </div>
      )}
    </div>
  );
}

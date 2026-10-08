"use client";

import { label } from "@/lib/labels";
import { useCallback, useEffect, useState } from "react";

type Cert = { id: string; name: string; issuer: string | null; fileUrl: string | null; expiresAt: string | null; verified: boolean };
type Cat = { id: string; nameEn: string; nameAr: string };
type Factory = {
  name: string; region: string; description: string | null; address: string | null;
  website: string | null; commercialRegNo: string | null; taxNo: string | null; capabilities: string | null; shippingReturnPolicy: string | null; logoUrl: string | null;
  verification: string; categories: { categoryId: string }[]; certifications: Cert[];
};

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/uploads", { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d.url;
}

export default function FactoryProfilePage() {
  const [f, setF] = useState({ name: "", region: "", description: "", address: "", website: "", capabilities: "", shippingReturnPolicy: "", commercialRegNo: "", taxNo: "", logoUrl: "" });
  const [locked, setLocked] = useState({ reg: false, tax: false });
  const [catIds, setCatIds] = useState<string[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [verification, setVerification] = useState("UNVERIFIED");
  const [cert, setCert] = useState({ name: "", issuer: "", expiresAt: "", fileUrl: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/factory/profile");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    const x: Factory = d.factory;
    setF({
      name: x.name, region: x.region, description: x.description ?? "", address: x.address ?? "",
      website: x.website ?? "", capabilities: x.capabilities ?? "", shippingReturnPolicy: x.shippingReturnPolicy ?? "", commercialRegNo: x.commercialRegNo ?? "", taxNo: x.taxNo ?? "", logoUrl: x.logoUrl ?? "",
    });
    setCatIds(x.categories.map((c) => c.categoryId));
    setCerts(x.certifications);
    setVerification(x.verification);
    setLocked({ reg: Boolean(x.commercialRegNo), tax: Boolean(x.taxNo) });
  }, []);

  useEffect(() => {
    load();
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories ?? []));
  }, [load]);

  const note = (ok: string) => { setMsg(ok); setError(""); };

  async function call(url: string, method: string, body?: unknown, ok = "تم الحفظ.") {
    const r = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setMsg(""); return false; }
    note(ok);
    await load();
    return true;
  }

  async function pick(file: File | undefined, apply: (url: string) => void) {
    if (!file) return;
    try { apply(await upload(file)); setError(""); }
    catch (e) { setError((e as Error).message); }
  }

  const field = "w-full rounded border p-2";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ملف المصنع</h1>
        <span className="rounded-full border px-3 py-1 text-sm">{label(verification)}</span>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {msg && <p className="text-green-700">{msg}</p>}

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="font-semibold">معلومات الشركة</h2>
        <div className="flex items-center gap-3">
          {f.logoUrl && <img src={f.logoUrl} alt="" className="h-14 w-14 rounded border object-cover" />}
          <input type="file" accept="image/png,image/jpeg,image/webp"
            onChange={(e) => pick(e.target.files?.[0], (url) => setF({ ...f, logoUrl: url }))} />
        </div>
        <input className={field} placeholder="اسم المصنع" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={field} placeholder="المنطقة" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} />
        <input className={field} dir="ltr" placeholder="رقم السجل التجاري / الصناعي" value={f.commercialRegNo} disabled={locked.reg}
          onChange={(e) => setF({ ...f, commercialRegNo: e.target.value })} />
        <input className={field} dir="ltr" placeholder="الرقم الضريبي" value={f.taxNo} disabled={locked.tax}
          onChange={(e) => setF({ ...f, taxNo: e.target.value })} />
        {(locked.reg || locked.tax) && <p className="text-xs text-gray-500">لا يمكن تعديل السجل والرقم الضريبي بعد حفظهما؛ للتعديل راسل الإدارة على info@sooqalbeet.com.</p>}
        <input className={field} placeholder="العنوان" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <input className={field} placeholder="الموقع الإلكتروني (https://…)" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
        <textarea className={field} placeholder="الوصف" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <textarea className={field} placeholder="القدرات الإنتاجية" value={f.capabilities} onChange={(e) => setF({ ...f, capabilities: e.target.value })} />
        <div>
          <div className="mb-1 text-sm text-gray-500">سياسة الشحن والإرجاع (تظهر للمشترين في صفحة مصنعك)</div>
          <textarea className={field} rows={5} value={f.shippingReturnPolicy}
            placeholder="مثال: نشحن خلال 7 أيام من تأكيد الطلب عبر شركة شحن نختارها، الشحن على حساب المشتري، يُقبل الإرجاع للعيوب المصنعية خلال 14 يوماً من الاستلام…"
            onChange={(e) => setF({ ...f, shippingReturnPolicy: e.target.value })} />
          <p className="mt-1 text-xs text-gray-500">المنصة لا تشحن ولا تتحمل سياسة الشحن والإرجاع؛ هذه السياسة خاصة بمصنعك وحدك.</p>
        </div>

        <div>
          <div className="mb-1 text-sm text-gray-500">التصنيفات</div>
          <div className="flex flex-wrap gap-3">
            {cats.map((c) => (
              <label key={c.id} className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={catIds.includes(c.id)}
                  onChange={(e) => setCatIds(e.target.checked ? [...catIds, c.id] : catIds.filter((i) => i !== c.id))} />
                {c.nameAr}
              </label>
            ))}
          </div>
        </div>
        <button className="rounded bg-brand px-4 py-2 text-white"
          onClick={() => call("/api/factory/profile", "PATCH", { ...f, categoryIds: catIds })}>حفظ الملف</button>
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="font-semibold">الشهادات</h2>
        {certs.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b py-2 text-sm">
            <span>
              <b>{c.name}</b>{c.issuer ? ` · ${c.issuer}` : ""}
              {c.expiresAt ? ` · تنتهي ${new Date(c.expiresAt).toLocaleDateString("ar-u-nu-latn")}` : ""}
              {c.fileUrl && <> · <a className="text-brand" href={c.fileUrl} target="_blank">الملف</a></>}
              <span className="ms-2 text-xs text-gray-500">{c.verified ? "✓ موثّقة" : "قيد المراجعة"}</span>
            </span>
            <button className="text-red-600" onClick={() => confirm("هل تريد حذف هذه الشهادة؟") && call(`/api/factory/certifications/${c.id}`, "DELETE", undefined, "تم الحذف.")}>حذف</button>
          </div>
        ))}
        {certs.length === 0 && <p className="text-sm text-gray-500">لا توجد شهادات بعد.</p>}

        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          <input className={field} placeholder="الاسم (مثل ISO 9001)" value={cert.name} onChange={(e) => setCert({ ...cert, name: e.target.value })} />
          <input className={field} placeholder="الجهة المانحة" value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} />
          <input className={field} type="date" value={cert.expiresAt} onChange={(e) => setCert({ ...cert, expiresAt: e.target.value })} />
          <input type="file" accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => pick(e.target.files?.[0], (url) => setCert({ ...cert, fileUrl: url }))} />
        </div>
        {cert.fileUrl && <p className="text-xs text-gray-500">تم إرفاق الملف.</p>}
        <button disabled={!cert.name} className="rounded border border-brand px-4 py-2 text-brand disabled:opacity-50"
          onClick={async () => {
            const ok = await call("/api/factory/certifications", "POST", {
              name: cert.name, issuer: cert.issuer || undefined,
              expiresAt: cert.expiresAt || undefined, fileUrl: cert.fileUrl || undefined,
            }, "تمت إضافة الشهادة.");
            if (ok) setCert({ name: "", issuer: "", expiresAt: "", fileUrl: "" });
          }}>إضافة شهادة</button>
      </section>

      {["UNVERIFIED", "REJECTED"].includes(verification) && (
        <button className="rounded bg-green-600 px-4 py-2 text-white"
          onClick={() => call("/api/factory/profile/verify", "POST", undefined, "تم إرسال طلب التوثيق.")}>
          طلب التوثيق
        </button>
      )}
    </div>
  );
}

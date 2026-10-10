"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import PhoneInput from "@/components/PhoneInput";
import { buildPhone, DEFAULT_COUNTRY } from "@/lib/countries";

export default function RegisterPage() {
  const [role, setRole] = useState<"CLIENT" | "FACTORY">("CLIENT");
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", factoryName: "", description: "", region: "", commercialRegNo: "", taxNo: "" });
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, phone: buildPhone(country, f.phone), country, role }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    window.location.href = "/verify-email";
  }

  const field = "w-full rounded border p-2";
  const tab = (r: "CLIENT" | "FACTORY") =>
    `flex-1 rounded border p-2 ${role === r ? "bg-brand text-white" : ""}`;

  return (
    <div className="mx-auto mt-12 max-w-md space-y-3 p-6">
      <Image src="/emblem.png" alt="" width={96} height={96} className="mx-auto h-20 w-20" />
      <h1 className="text-center text-2xl font-bold text-brand">إنشاء حساب</h1>

      <div className="flex gap-2">
        <button className={tab("CLIENT")} onClick={() => setRole("CLIENT")}>أنا مشترٍ</button>
        <button className={tab("FACTORY")} onClick={() => setRole("FACTORY")}>أنا مصنع</button>
      </div>

      <input className={field} placeholder="اسمك" value={f.name} onChange={set("name")} />
      <input className={field} type="email" placeholder="البريد الإلكتروني" value={f.email} onChange={set("email")} />
      <input className={field} type="password" placeholder="كلمة المرور (8 أحرف على الأقل)" value={f.password}
        onChange={set("password")} />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف (اختر الدولة من القائمة)</label>
        <PhoneInput country={country} onCountry={setCountry} value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
        <p className="mt-1 text-xs text-gray-500">تُحدَّد دولتك من رمز الدولة، ويُكتب الرقم بدون الصفر الأول (مثل 791234567).</p>
      </div>

      <textarea className={field} rows={4} maxLength={1000}
        placeholder={role === "FACTORY" ? "وصف المصنع: ماذا تصنّع؟ الطاقة الإنتاجية، الخبرة، الأسواق… (20 حرفاً على الأقل)" : "نبذة عنك أو عن شركتك: نشاطك التجاري، وما الذي تشتريه عادةً… (20 حرفاً على الأقل)"}
        value={f.description} onChange={set("description")} />
      <p className="-mt-2 text-end text-xs text-gray-400">{f.description.trim().length} / 1000</p>

      {role === "FACTORY" && (
        <>
          <input className={field} placeholder="اسم المصنع" value={f.factoryName} onChange={set("factoryName")} />
          <input className={field} placeholder="المدينة / المنطقة (مثل عمّان)" value={f.region} onChange={set("region")} />
          <input className={field} dir="ltr" placeholder="رقم السجل التجاري / الصناعي" value={f.commercialRegNo} onChange={set("commercialRegNo")} />
          <input className={field} dir="ltr" placeholder="الرقم الضريبي" value={f.taxNo} onChange={set("taxNo")} />
          <p className="text-xs text-gray-500">يجب أن يطابق اسم المصنع الاسم الرسمي في السجل؛ ولا يُسمح بأكثر من حساب لنفس السجل.</p>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy || !f.name || !f.email || !f.password || !f.phone || f.description.trim().length < 20 || (role === "FACTORY" && (!f.factoryName || !f.region || !f.commercialRegNo || !f.taxNo))} onClick={submit}
        className="w-full rounded bg-brand p-2 text-white disabled:opacity-50">إنشاء الحساب</button>
      <p className="text-center text-xs text-gray-500">بإنشاء حساب فإنك توافق على <Link href="/terms" className="text-brand underline">الشروط والأحكام</Link> و<Link href="/privacy" className="text-brand underline">سياسة الخصوصية</Link>.</p>
      <p className="text-sm text-gray-500">
        لديك حساب؟ <Link href="/login" className="text-brand">سجّل الدخول</Link>
      </p>
    </div>
  );
}

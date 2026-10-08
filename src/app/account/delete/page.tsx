"use client";

import Link from "next/link";
import { useState } from "react";

export default function DeleteAccountPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError("");
    const r = await fetch("/api/account/delete", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, confirm }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    window.location.href = "/?deleted=1";
  }

  const field = "w-full rounded border p-2";
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-3 text-2xl font-bold text-accent">حذف حسابي</h1>
      <div className="rounded-lg border border-accent bg-accent-light p-4 text-sm leading-7">
        <p className="font-semibold">قبل أن تتابع:</p>
        <ul className="list-disc ps-5">
          <li>الحذف نهائي ولا يمكن التراجع عنه.</li>
          <li>سيُمسح اسمك وبريدك وهاتفك وملفك الشخصي، وتُحذف رسائلك وشهاداتك المرفوعة، وتُخفى منتجاتك (إن كنت مصنعاً).</li>
          <li>عروض الأسعار المفتوحة تُرفض تلقائياً.</li>
          <li>لا يمكن الحذف أثناء وجود طلبات نشطة؛ أنهِها أو ألغِها أولاً.</li>
          <li>تبقى سجلات الطلبات المكتملة بلا أي هوية، لأنها جزء من سجلات الطرف الآخر وقد تقتضيها التزامات قانونية أو مالية.</li>
        </ul>
      </div>
      <p className="mt-4 text-sm">يُنصح بـ <Link href="/account/export" className="text-brand underline">تصدير بياناتك</Link> أولاً.</p>

      <div className="mt-4 space-y-2">
        {error && <p className="text-red-600">{error}</p>}
        <input type="password" className={field} placeholder="كلمة المرور الحالية" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className={field} placeholder="اكتب كلمة «حذف» للتأكيد" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button onClick={submit} disabled={busy || !password || confirm !== "حذف"}
          className="rounded bg-accent px-5 py-2 text-white hover:bg-accent-dark disabled:opacity-50">حذف حسابي نهائياً</button>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const started = useRef(false);

  const go = (role: string) => {
    window.location.href = role === "FACTORY" ? "/factory/dashboard" : role === "ADMIN" ? "/admin" : "/marketplace";
  };

  const send = useCallback(async () => {
    setError(""); setInfo("");
    const r = await fetch("/api/auth/verify-email/send", { method: "POST" });
    const d = await r.json();
    if (r.ok && d.verified) {
      const me = await (await fetch("/api/auth/me")).json();
      return go(me.user?.role);
    }
    if (r.ok) { setInfo("أرسلنا رمزاً من 6 أرقام إلى بريدك الإلكتروني المسجّل."); setCooldown(60); return; }
    if (r.status === 429) { setInfo("أُرسل رمز قبل قليل. تحقق من بريدك (وملف الرسائل المزعجة)، أو انتظر دقيقة لإعادة الإرسال."); setCooldown(60); return; }
    setError(d.error);
  }, []);

  // Registration already emailed a code; login of an unverified account has not. The 60s cooldown makes this safe in both cases.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    send();
  }, [send]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function confirm() {
    setBusy(true); setError("");
    const r = await fetch("/api/auth/verify-email/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    go(d.role);
  }

  return (
    <div className="mx-auto mt-12 max-w-sm space-y-3 p-6">
      <Image src="/emblem.png" alt="" width={96} height={96} className="mx-auto h-20 w-20" />
      <h1 className="text-center text-2xl font-bold text-brand">توثيق البريد الإلكتروني</h1>
      <p className="text-center text-sm text-gray-600">أدخل الرمز المكوّن من 6 أرقام لاتينية الذي وصلك على بريدك. صالح لمدة 10 دقائق.</p>
      {info && <p className="rounded bg-brand-light p-2 text-sm text-brand">{info}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        className="w-full rounded border p-3 text-center text-2xl tracking-[0.5em]" dir="ltr"
        inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
        value={code} onChange={(e) => setCode(e.target.value.trim())}
        onKeyDown={(e) => e.key === "Enter" && code.length === 6 && confirm()}
      />
      <button onClick={confirm} disabled={busy || code.length !== 6}
        className="w-full rounded bg-brand p-2 text-white disabled:opacity-50">تأكيد</button>
      <button onClick={send} disabled={cooldown > 0}
        className="w-full rounded border p-2 text-sm disabled:opacity-50">
        {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ث` : "إعادة إرسال الرمز"}
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);

    // Only follow same-site relative redirects.
    const next = new URLSearchParams(window.location.search).get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    window.location.href = d.user.verified === false ? "/verify-email" : safe ?? (d.user.role === "FACTORY" ? "/factory/dashboard" : d.user.role === "ADMIN" ? "/admin" : "/marketplace");
  }

  const field = "w-full rounded border p-2";

  return (
    <div className="mx-auto mt-16 max-w-sm space-y-3 p-6">
      <Image src="/emblem.png" alt="" width={96} height={96} className="mx-auto h-20 w-20" />
      <h1 className="text-center text-2xl font-bold text-brand">تسجيل الدخول</h1>
      <input className={field} type="email" placeholder="البريد الإلكتروني" value={email}
        onChange={(e) => setEmail(e.target.value)} />
      <input className={field} type="password" placeholder="كلمة المرور" value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy || !email || !password} onClick={submit}
        className="w-full rounded bg-brand p-2 text-white disabled:opacity-50">دخول</button>
      <p className="text-sm text-gray-500">
        ليس لديك حساب؟ <Link href="/register" className="text-brand">أنشئ حساباً</Link>
      </p>
    </div>
  );
}

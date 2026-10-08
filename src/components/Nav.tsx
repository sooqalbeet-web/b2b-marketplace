"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type User = { id: string; name: string; role: "CLIENT" | "FACTORY" | "ADMIN"; verified: boolean } | null;

const LINKS: Record<string, [string, string][]> = {
  CLIENT: [["السوق", "/marketplace"], ["عروض أسعاري", "/quotations"], ["طلباتي", "/orders"], ["الرسائل", "/messages"]],
  FACTORY: [["لوحة التحكم", "/factory/dashboard"], ["عروض الأسعار", "/factory/quotations"], ["الطلبات", "/factory/orders"], ["المنتجات", "/factory/products"], ["المخزون", "/factory/inventory"], ["الجودة", "/factory/quality"], ["الرسائل", "/messages"], ["الملف", "/factory/profile"]],
  ADMIN: [["التوثيق", "/admin"], ["السوق", "/marketplace"]],
};

export default function Nav() {
  const [user, setUser] = useState<User>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user)).finally(() => setReady(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <>
    {user && !user.verified && (
      <div className="bg-accent-light p-2 text-center text-sm text-accent">
        بريدك الإلكتروني غير موثّق — <Link href="/verify-email" className="font-semibold underline">وثّقه الآن</Link> لتتمكن من استخدام المنصة.
      </div>
    )}
    <header className="border-b-4 border-brand bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
        <Link href="/" aria-label="سوق البيت"><Image src="/logo.png" alt="سوق البيت — SOOQ AL BEET" width={1400} height={433} priority className="h-11 w-auto" /></Link>
        {user ? (
          <>
            {LINKS[user.role].map(([l, h]) => <Link key={h} href={h} className="hover:text-accent">{l}</Link>)}
            <Link href="/account" className="ms-auto text-gray-600 hover:text-accent">{user.name} · حسابي</Link>
            <button onClick={logout} className="rounded border px-3 py-1 hover:bg-gray-50">تسجيل الخروج</button>
          </>
        ) : (
          ready && (
            <>
              <Link href="/marketplace" className="hover:text-accent">السوق</Link>
              <Link href="/login" className="ms-auto rounded border px-3 py-1 hover:bg-gray-50">دخول</Link>
              <Link href="/register" className="rounded bg-accent px-3 py-1 text-white hover:bg-accent-dark">إنشاء حساب</Link>
            </>
          )
        )}
      </nav>
    </header>
    </>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

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
    <header className="sticky top-0 z-40 border-t-4 border-brand bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 px-4 py-2.5 text-[15px]">
        <Link href="/" aria-label="سوق البيت"><Image src="/logo.png" alt="سوق البيت — SOOQ AL BEET" width={1400} height={433} priority className="me-3 h-11 w-auto" /></Link>
        {user ? (
          <>
            {LINKS[user.role].map(([l, h]) => <Link key={h} href={h} className={`rounded-md px-2.5 py-1.5 font-medium ${pathname === h || pathname.startsWith(h + "/") ? "bg-brand-light text-brand" : "text-gray-700 hover:bg-gray-100 hover:text-brand"}`}>{l}</Link>)}
            <Link href="/account" className="ms-auto rounded-md px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-brand">{user.name} · حسابي</Link>
            <button onClick={logout} className="rounded-lg border border-gray-300 px-3.5 py-1.5 font-medium text-gray-700 hover:bg-gray-50">تسجيل الخروج</button>
          </>
        ) : (
          ready && (
            <>
              <Link href="/marketplace" className="rounded-md px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-100 hover:text-brand">السوق</Link>
              <Link href="/login" className="ms-auto rounded-lg border border-gray-300 px-4 py-1.5 font-medium text-gray-700 hover:bg-gray-50">دخول</Link>
              <Link href="/register" className="rounded-lg bg-accent px-4 py-1.5 font-medium text-white shadow-sm hover:bg-accent-dark">إنشاء حساب</Link>
            </>
          )
        )}
      </nav>
    </header>
    </>
  );
}

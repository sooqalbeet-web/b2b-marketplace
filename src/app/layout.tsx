import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "سوق البيت | SOOQ AL BEET — ابحث عن أفضل المصانع لعملك التجاري",
  description: "اطلب عروض أسعار من مصانع موثّقة، فاوض على الأسعار وتابع طلبات الجملة.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col text-gray-900">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="mt-20 bg-brand-dark text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
            <div>
              <div className="text-lg font-bold">SOOQ AL BEET · سوق البيت</div>
              <p className="mt-2 text-sm leading-7 text-white/70">ابحث عن أفضل المصانع لعملك التجاري، واطلب عروض الأسعار وتابع طلبات الجملة في مكان واحد.</p>
            </div>
            <div>
              <div className="font-semibold">روابط سريعة</div>
              <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/70">
                <Link href="/marketplace" className="hover:text-white">السوق</Link>
                <Link href="/register" className="hover:text-white">إنشاء حساب</Link>
                <Link href="/login" className="hover:text-white">تسجيل الدخول</Link>
              </div>
            </div>
            <div>
              <div className="font-semibold">قانوني</div>
              <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/70">
                <Link href="/terms" className="hover:text-white">الشروط والأحكام</Link>
                <Link href="/privacy" className="hover:text-white">سياسة الخصوصية</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} SOOQ AL BEET · سوق البيت — جميع الحقوق محفوظة</div>
        </footer>
      </body>
    </html>
  );
}

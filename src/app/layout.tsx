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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Nav />
        <main>{children}</main>
        <footer className="mt-16 bg-brand py-6 text-center text-sm text-white">
          <span className="font-semibold">SOOQ AL BEET</span> · سوق البيت — ابحث عن أفضل المصانع لعملك التجاري
          <div className="mt-2 flex justify-center gap-4"><Link href="/terms" className="underline hover:text-red-200">الشروط والأحكام</Link><Link href="/privacy" className="underline hover:text-red-200">سياسة الخصوصية</Link></div>
        </footer>
      </body>
    </html>
  );
}

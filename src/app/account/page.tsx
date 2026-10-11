import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-brand">حسابي</h1>
      <p className="mb-6 text-sm text-gray-600">إدارة بياناتك الشخصية وفق <Link href="/privacy" className="text-brand underline">سياسة الخصوصية</Link>.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/export" className="rounded-lg border-t-4 border-brand bg-white p-5 shadow-sm hover:bg-brand-light">
          <div className="font-semibold">تصدير بياناتي</div>
          <p className="mt-1 text-sm text-gray-600">نزّل نسخة من كل البيانات التي نحتفظ بها عنك (حق الوصول).</p>
        </Link>
        <Link href="/account/delete" className="rounded-lg border-t-4 border-accent bg-white p-5 shadow-sm hover:bg-accent-light">
          <div className="font-semibold text-accent">حذف حسابي</div>
          <p className="mt-1 text-sm text-gray-600">اطلب حذف بياناتك الشخصية من سجلاتنا (حق الحذف).</p>
        </Link>
      </div>
    </div>
  );
}

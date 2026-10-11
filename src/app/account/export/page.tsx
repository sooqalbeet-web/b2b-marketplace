import Link from "next/link";

export default function ExportPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-3 text-2xl font-bold text-brand">تصدير بياناتي</h1>
      <p className="text-sm leading-7 text-gray-700">
        ننزّل لك ملف JSON فيه بيانات حسابك، وملف مصنعك ومنتجاتك وشهاداتك (إن كنت مصنعاً)، وعروض الأسعار والعروض المتبادلة، والطلبات والشحنات،
        والمحادثات التي شاركت فيها. لا يتضمن الملف كلمة المرور.
      </p>
      <a href="/api/account/export" download
        className="mt-5 inline-block rounded bg-brand px-5 py-2 text-white hover:bg-brand-dark">تنزيل بياناتي</a>
      <p className="mt-4 text-xs text-gray-500">
        يحتوي الملف على معلومات شخصية، فاحفظه في مكان آمن. <Link href="/account" className="text-brand underline">رجوع</Link>
      </p>
    </div>
  );
}

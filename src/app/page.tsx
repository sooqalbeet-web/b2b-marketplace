import Link from "next/link";
import Image from "next/image";

const STEPS = [
  ["١. اعثر على المصانع", "تصفّح مصانع موثّقة حسب التصنيف والمنطقة والشهادات."],
  ["٢. اطلب عرض سعر", "أرسل الكمية والمواصفات والسعر المستهدف إلى مصنع أو أكثر."],
  ["٣. فاوض", "المصنع يسعّر وأنت تقابل بعرضك، وكل جولة تُحفظ في السجل."],
  ["٤. اطلب وتابع", "اقبل العرض لإنشاء الطلب ثم تابع الإنتاج والجودة والشحن."],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  return (
    <div>
      {deleted && <p className="bg-brand-light p-3 text-center text-sm text-brand">تم حذف حسابك. نأمل أن نراك مجدداً.</p>}
      <section className="bg-gradient-to-l from-brand to-brand-dark text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-14 md:flex-row">
          <Image src="/emblem.png" alt="" width={512} height={512} className="h-40 w-40 rounded-full bg-white p-3 shadow-lg" priority />
          <div>
            <h1 className="text-4xl font-bold">اشترِ مباشرة من <span className="text-red-200">المصانع</span></h1>
            <p className="mt-3 max-w-2xl text-lg text-white/85">
              سوق جملة يجمع المشترين والمصنّعين: اطلب عروض الأسعار، فاوض على أسعار الكميات الكبيرة وأدر طلباتك في مكان واحد.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/marketplace" className="rounded bg-white px-5 py-2 font-medium text-brand hover:bg-brand-light">تصفّح المصانع</Link>
              <Link href="/register" className="rounded bg-accent px-5 py-2 font-medium text-white hover:bg-accent-dark">انضم كمشترٍ أو مصنع</Link>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto mt-10 grid max-w-5xl gap-4 px-4 sm:grid-cols-2">
        {STEPS.map(([t, d]) => (
          <div key={t} className="rounded-lg border-t-4 border-accent bg-white p-4 shadow-sm">
            <div className="font-semibold text-brand">{t}</div>
            <div className="mt-1 text-sm text-gray-600">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

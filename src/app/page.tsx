import Link from "next/link";
import Image from "next/image";

const STEPS = [
  ["1", "اعثر على المصانع", "تصفّح مصانع موثّقة حسب التصنيف والمنطقة والشهادات."],
  ["2", "اطلب عرض سعر", "أرسل الكمية والمواصفات والسعر المستهدف إلى مصنع أو أكثر."],
  ["3", "فاوض", "المصنع يسعّر وأنت تقابل بعرضك، وكل جولة تُحفظ في السجل."],
  ["4", "اطلب وتابع", "اقبل العرض لإنشاء الطلب ثم تابع الإنتاج والجودة والشحن."],
];

const FEATURES = [
  ["مصانع موثّقة", "حسابات المصانع تُراجع وتُوثّق قبل ظهور شارة التوثيق."],
  ["تفاوض شفاف", "جميع جولات التفاوض على السعر محفوظة في سجل واحد."],
  ["متابعة الطلب", "تتبّع الإنتاج والجودة والشحن حتى التسليم."],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  return (
    <div>
      {deleted && <p className="bg-brand-light p-3 text-center text-sm text-brand">تم حذف حسابك. نأمل أن نراك مجدداً.</p>}

      <section className="relative overflow-hidden bg-gradient-to-l from-brand to-brand-dark text-white">
        <div className="pointer-events-none absolute -start-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 end-10 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-16 md:flex-row md:py-24">
          <Image src="/emblem.png" alt="" width={512} height={512} className="h-40 w-40 shrink-0 rounded-full bg-white p-3 shadow-2xl ring-8 ring-white/10 md:h-52 md:w-52" priority />
          <div className="text-center md:text-start">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">اشترِ مباشرة من <span className="text-red-200">المصانع</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              سوق جملة يجمع المشترين والمصنّعين: اطلب عروض الأسعار، فاوض على أسعار الكميات الكبيرة وأدر طلباتك في مكان واحد.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href="/marketplace" className="rounded-lg bg-white px-6 py-3 font-semibold text-brand shadow-sm hover:bg-brand-light">تصفّح المصانع</Link>
              <Link href="/register" className="rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow-sm hover:bg-accent-dark">انضم كمشترٍ أو مصنع</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-5xl gap-4 px-4 sm:grid-cols-3">
        {FEATURES.map(([t, d]) => (
          <div key={t} className="rounded-xl bg-white p-5 shadow-md ring-1 ring-black/5">
            <div className="font-bold text-brand">{t}</div>
            <div className="mt-1 text-sm leading-7 text-gray-600">{d}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-5xl px-4">
        <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">كيف يعمل سوق البيت؟</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, t, d]) => (
            <div key={n} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">{n}</div>
              <div className="mt-3 font-bold text-brand">{t}</div>
              <div className="mt-1 text-sm leading-7 text-gray-600">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl px-4">
        <div className="rounded-2xl bg-brand-light p-8 text-center ring-1 ring-brand/10">
          <h2 className="text-xl font-bold text-brand md:text-2xl">جاهز لبدء أول طلب جملة؟</h2>
          <p className="mt-2 text-gray-600">أنشئ حسابك مجاناً وابدأ بطلب عروض الأسعار من المصانع.</p>
          <Link href="/register" className="mt-5 inline-block rounded-lg bg-brand px-7 py-3 font-semibold text-white shadow-sm hover:bg-brand-dark">إنشاء حساب</Link>
        </div>
      </section>
    </div>
  );
}

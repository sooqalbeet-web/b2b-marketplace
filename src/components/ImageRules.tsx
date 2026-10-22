import { IMAGE_MAX_SIDE, MAX_IMAGES_PER_FACTORY, MAX_UPLOAD_MB } from "@/lib/limits";

// Written conditions for factories: acceptance rules and how many images / which images may be uploaded.
export default function ImageRules({ open = false }: { open?: boolean }) {
  return (
    <details open={open} className="rounded-lg border border-brand/30 bg-brand-light/40 p-3 text-sm leading-7 text-gray-700">
      <summary className="cursor-pointer font-semibold text-brand">شروط قبول المصنع وإرشادات رفع الصور</summary>
      <div className="mt-2 space-y-3">
        <div>
          <p className="font-semibold text-gray-900">شروط قبول المصنع</p>
          <ul className="list-disc ps-5">
            <li>بيانات صحيحة: اسم المصنع الرسمي كما في السجل، ورقم السجل التجاري والرقم الضريبي، ووصف حقيقي للمصنع.</li>
            <li>حساب واحد فقط لكل سجل تجاري.</li>
            <li>تظهر شارة «موثّق» على صفحة المصنع بعد أن تراجع الإدارة شهاداتك وتعتمدها.</li>
            <li>المصنع مسؤول عن صحة بياناته ومنتجاته وصورها.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-900">رفع الصور والعدد المسموح</p>
          <ul className="list-disc ps-5">
            <li>العدد المسموح: <b>{MAX_IMAGES_PER_FACTORY} صور للمصنع كله</b>، وزّعها كما تشاء على منتجاتك.</li>
            <li>الصيغ المقبولة: PNG أو JPEG أو WebP، وبحد أقصى {MAX_UPLOAD_MB} ميغابايت للصورة. تُصغَّر الصورة وتُضغط تلقائياً قبل الرفع (حتى {IMAGE_MAX_SIDE} بكسل للضلع الأطول)، فلا تقلق من حجم صور الهاتف.</li>
            <li>صور حقيقية لمنتجك أنت وبحقوقك، واضحة وبإضاءة جيدة، ويفضّل خلفية نظيفة. الحد الأدنى المقترح 600 بكسل.</li>
            <li>ممنوع: صور منسوخة من الإنترنت أو من مصانع أخرى، وأرقام هواتف أو روابط أو شعارات مواقع أخرى داخل الصورة، وأي محتوى مخالف.</li>
            <li>الشعار: صورة مربعة قدر الإمكان.</li>
            <li>المستندات بصيغة <b>PDF فقط</b> (بحد أقصى {MAX_UPLOAD_MB} ميغابايت للملف): <b>ملف السجل التجاري</b>، و<b>ملف الشهادات</b> (يُفضَّل جمع شهاداتك في ملف PDF واحد واضح ومقروء).</li>
            <li>تحتفظ إدارة المنصة بحق إزالة أي صورة أو منتج مخالف لهذه الشروط.</li>
          </ul>
        </div>
      </div>
    </details>
  );
}

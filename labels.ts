// Arabic labels for enum values shown in the UI.
const L: Record<string, string> = {
  ALL: "الكل",
  // quotation
  SENT: "جديد", RECEIVED: "مستلم", QUOTED: "تم التسعير", NEGOTIATION: "قيد التفاوض",
  ACCEPTED: "مقبول", REJECTED: "مرفوض",
  // order
  CONFIRMED: "مؤكد", IN_PRODUCTION: "قيد الإنتاج", QC: "فحص الجودة",
  READY_TO_SHIP: "جاهز للشحن", SHIPPED: "تم الشحن", DELIVERED: "تم التسليم", CANCELLED: "ملغي",
  // quality
  PENDING: "قيد المراجعة", PASSED: "ناجح", FAILED: "راسب", PARTIAL: "جزئي",
  // verification
  UNVERIFIED: "غير موثّق", VERIFIED: "موثّق",
  // parties
  CLIENT: "المشتري", FACTORY: "المصنع", ADMIN: "الإدارة",
  // inventory
  ADJUSTMENT: "تعديل يدوي", QUALITY_PASS: "إدخال بعد الجودة", STOCK_OUT: "إخراج للشحن",
  // production
  PLANNED: "مخطط", IN_PROGRESS: "قيد التنفيذ", COMPLETED: "مكتمل",
};

export const label = (v: string | null | undefined) => (v ? L[v] ?? v : "—");

export const LOCALE = "ar-u-nu-latn"; // Arabic text, Latin digits (clearer for prices/quantities)

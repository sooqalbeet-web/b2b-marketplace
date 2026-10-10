// Countries shown in the phone-number picker. `code` is ISO 3166-1 alpha-2 (stored on Factory.country),
// `dial` is the international calling code without "+".
export type Country = { code: string; ar: string; en: string; dial: string };

export const COUNTRIES: Country[] = [
  // Arab world first
  { code: "JO", ar: "الأردن", en: "Jordan", dial: "962" },
  { code: "SA", ar: "السعودية", en: "Saudi Arabia", dial: "966" },
  { code: "AE", ar: "الإمارات", en: "United Arab Emirates", dial: "971" },
  { code: "KW", ar: "الكويت", en: "Kuwait", dial: "965" },
  { code: "QA", ar: "قطر", en: "Qatar", dial: "974" },
  { code: "BH", ar: "البحرين", en: "Bahrain", dial: "973" },
  { code: "OM", ar: "عُمان", en: "Oman", dial: "968" },
  { code: "IQ", ar: "العراق", en: "Iraq", dial: "964" },
  { code: "SY", ar: "سوريا", en: "Syria", dial: "963" },
  { code: "LB", ar: "لبنان", en: "Lebanon", dial: "961" },
  { code: "PS", ar: "فلسطين", en: "Palestine", dial: "970" },
  { code: "EG", ar: "مصر", en: "Egypt", dial: "20" },
  { code: "SD", ar: "السودان", en: "Sudan", dial: "249" },
  { code: "LY", ar: "ليبيا", en: "Libya", dial: "218" },
  { code: "TN", ar: "تونس", en: "Tunisia", dial: "216" },
  { code: "DZ", ar: "الجزائر", en: "Algeria", dial: "213" },
  { code: "MA", ar: "المغرب", en: "Morocco", dial: "212" },
  { code: "MR", ar: "موريتانيا", en: "Mauritania", dial: "222" },
  { code: "YE", ar: "اليمن", en: "Yemen", dial: "967" },
  { code: "SO", ar: "الصومال", en: "Somalia", dial: "252" },
  { code: "DJ", ar: "جيبوتي", en: "Djibouti", dial: "253" },
  { code: "KM", ar: "جزر القمر", en: "Comoros", dial: "269" },
  // Asia
  { code: "TR", ar: "تركيا", en: "Turkey", dial: "90" },
  { code: "CN", ar: "الصين", en: "China", dial: "86" },
  { code: "HK", ar: "هونغ كونغ", en: "Hong Kong", dial: "852" },
  { code: "TW", ar: "تايوان", en: "Taiwan", dial: "886" },
  { code: "IN", ar: "الهند", en: "India", dial: "91" },
  { code: "PK", ar: "باكستان", en: "Pakistan", dial: "92" },
  { code: "BD", ar: "بنغلاديش", en: "Bangladesh", dial: "880" },
  { code: "ID", ar: "إندونيسيا", en: "Indonesia", dial: "62" },
  { code: "MY", ar: "ماليزيا", en: "Malaysia", dial: "60" },
  { code: "TH", ar: "تايلاند", en: "Thailand", dial: "66" },
  { code: "VN", ar: "فيتنام", en: "Vietnam", dial: "84" },
  { code: "SG", ar: "سنغافورة", en: "Singapore", dial: "65" },
  { code: "KR", ar: "كوريا الجنوبية", en: "South Korea", dial: "82" },
  { code: "JP", ar: "اليابان", en: "Japan", dial: "81" },
  { code: "IR", ar: "إيران", en: "Iran", dial: "98" },
  // Europe
  { code: "GB", ar: "بريطانيا", en: "United Kingdom", dial: "44" },
  { code: "DE", ar: "ألمانيا", en: "Germany", dial: "49" },
  { code: "FR", ar: "فرنسا", en: "France", dial: "33" },
  { code: "IT", ar: "إيطاليا", en: "Italy", dial: "39" },
  { code: "ES", ar: "إسبانيا", en: "Spain", dial: "34" },
  { code: "PT", ar: "البرتغال", en: "Portugal", dial: "351" },
  { code: "NL", ar: "هولندا", en: "Netherlands", dial: "31" },
  { code: "BE", ar: "بلجيكا", en: "Belgium", dial: "32" },
  { code: "CH", ar: "سويسرا", en: "Switzerland", dial: "41" },
  { code: "AT", ar: "النمسا", en: "Austria", dial: "43" },
  { code: "SE", ar: "السويد", en: "Sweden", dial: "46" },
  { code: "PL", ar: "بولندا", en: "Poland", dial: "48" },
  { code: "GR", ar: "اليونان", en: "Greece", dial: "30" },
  { code: "CY", ar: "قبرص", en: "Cyprus", dial: "357" },
  { code: "UA", ar: "أوكرانيا", en: "Ukraine", dial: "380" },
  { code: "RU", ar: "روسيا", en: "Russia", dial: "7" },
  // Americas / Africa / Oceania
  { code: "US", ar: "الولايات المتحدة", en: "United States", dial: "1" },
  { code: "CA", ar: "كندا", en: "Canada", dial: "1" },
  { code: "MX", ar: "المكسيك", en: "Mexico", dial: "52" },
  { code: "BR", ar: "البرازيل", en: "Brazil", dial: "55" },
  { code: "ZA", ar: "جنوب أفريقيا", en: "South Africa", dial: "27" },
  { code: "NG", ar: "نيجيريا", en: "Nigeria", dial: "234" },
  { code: "KE", ar: "كينيا", en: "Kenya", dial: "254" },
  { code: "ET", ar: "إثيوبيا", en: "Ethiopia", dial: "251" },
  { code: "AU", ar: "أستراليا", en: "Australia", dial: "61" },
];

export const DEFAULT_COUNTRY = "JO";

export const countryByCode = (code: string | null | undefined): Country | undefined =>
  COUNTRIES.find((c) => c.code === code);

/** Flag image (emoji flags do not render on Windows, so we use small PNGs). */
export const flagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export const toLatinDigits = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d))).replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));

/** Builds an international number (+9627...) from the selected country and what the user typed. */
export function buildPhone(country: string, typed: string): string {
  const c = countryByCode(country);
  let v = toLatinDigits(typed).replace(/[\s\-().]/g, "");
  if (v.startsWith("+")) return v;           // user typed a full international number
  if (v.startsWith("00")) return "+" + v.slice(2);
  v = v.replace(/\D/g, "").replace(/^0+/, ""); // drop the national trunk prefix (0791… -> 791…)
  return v ? `+${c?.dial ?? ""}${v}` : "";
}

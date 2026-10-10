"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, countryByCode, flagUrl } from "@/lib/countries";

type Props = {
  country: string;
  onCountry: (code: string) => void;
  value: string;
  onChange: (v: string) => void;
};

function Flag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={flagUrl(code)} alt="" width={24} height={16} loading="lazy" className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />;
}

export default function PhoneInput({ country, onCountry, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const current = countryByCode(country);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace("+", "");
    if (!s) return COUNTRIES;
    return COUNTRIES.filter((c) => c.ar.includes(s) || c.en.toLowerCase().includes(s) || c.dial.startsWith(s) || c.code.toLowerCase() === s);
  }, [q]);

  return (
    <div ref={box} className="relative" dir="ltr">
      <div className="flex">
        <button type="button" onClick={() => setOpen(!open)} aria-label="اختر الدولة"
          className="flex shrink-0 items-center gap-2 rounded-s-lg border border-e-0 border-gray-300 bg-gray-50 px-3 hover:bg-gray-100">
          <Flag code={country} />
          <span className="text-sm font-medium text-gray-700">+{current?.dial}</span>
          <span className="text-xs text-gray-400">▾</span>
        </button>
        <input type="tel" inputMode="tel" autoComplete="tel-national" placeholder="791234567"
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 rounded-s-none" />
      </div>

      {open && (
        <div className="absolute start-0 z-50 mt-1 w-72 max-w-[85vw] rounded-lg border bg-white shadow-lg" dir="rtl">
          <div className="border-b p-2">
            <input autoFocus placeholder="ابحث عن دولة أو رمز…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full py-1.5 text-sm" />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {list.map((c) => (
              <li key={c.code}>
                <button type="button" onClick={() => { onCountry(c.code); setOpen(false); setQ(""); }}
                  className={`flex w-full items-center gap-3 px-3 py-1.5 text-start text-sm hover:bg-brand-light ${c.code === country ? "bg-brand-light/60 font-semibold" : ""}`}>
                  <Flag code={c.code} />
                  <span className="flex-1">{c.ar}</span>
                  <span className="text-gray-500" dir="ltr">+{c.dial}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">لا نتائج</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

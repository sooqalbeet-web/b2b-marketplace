"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const pad = (n: number | string) => String(n).padStart(2, "0");

type Props = {
  /** "YYYY-MM-DD", or "" when no date is chosen */
  value: string;
  onChange: (v: string) => void;
  /** how many years after the current year can be chosen */
  yearsAhead?: number;
};

// Day / month / year dropdowns. Used instead of the browser's <input type="date">, which shows reversed Arabic text in Chrome.
export default function DateField({ value, onChange, yearsAhead = 15 }: Props) {
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");

  useEffect(() => {
    if (!value) { setY(""); setM(""); setD(""); return; }
    const [vy, vm, vd] = value.split("-");
    setY(vy ?? ""); setM(String(Number(vm))); setD(String(Number(vd)));
  }, [value]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: yearsAhead + 1 }, (_, i) => now + i);
  }, [yearsAhead]);

  function update(ny: string, nm: string, nd: string) {
    setY(ny); setM(nm);
    if (ny && nm && nd) {
      const max = new Date(Number(ny), Number(nm), 0).getDate(); // days in that month
      const day = Math.min(Number(nd), max);
      setD(String(day));
      onChange(`${ny}-${pad(nm)}-${pad(day)}`);
    } else {
      setD(nd);
      onChange("");
    }
  }

  const cls = "rounded border bg-white p-2";
  return (
    <div className="flex gap-2">
      <select className={`${cls} w-1/4`} value={d} onChange={(e) => update(y, m, e.target.value)} aria-label="اليوم">
        <option value="">اليوم</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <select className={`${cls} w-2/5`} value={m} onChange={(e) => update(y, e.target.value, d)} aria-label="الشهر">
        <option value="">الشهر</option>
        {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select className={`${cls} w-1/3`} value={y} onChange={(e) => update(e.target.value, m, d)} aria-label="السنة">
        <option value="">السنة</option>
        {years.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );
}

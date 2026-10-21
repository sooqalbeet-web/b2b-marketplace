"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { countryByCode, flagUrl } from "@/lib/countries";

type F = {
  id: string; name: string; region: string; description: string | null; address: string | null;
  commercialRegNo: string | null; taxNo: string | null;
  user: { name: string; email: string; phone: string | null };
  certifications: { id: string; name: string; issuer: string | null; fileUrl: string | null }[];
};

type U = {
  id: string; name: string; email: string; phone: string | null; country: string | null;
  role: "CLIENT" | "FACTORY"; description: string | null;
  companyName: string | null; companyCity: string | null; companyRegNo: string | null; companyTaxNo: string | null;
  createdAt: string; emailVerifiedAt: string | null;
  factory: { id: string; name: string; region: string; commercialRegNo: string | null; taxNo: string | null; verification: string } | null;
};
type Stats = { total: number; clients: number; factories: number; verified: number; last7: number };

const VERIFICATION: Record<string, string> = {
  VERIFIED: "موثّق", PENDING: "قيد المراجعة", UNVERIFIED: "غير موثّق", REJECTED: "مرفوض",
};
const date = (s: string) => new Date(s).toLocaleDateString("en-GB");

export default function AdminPage() {
  const [rows, setRows] = useState<F[]>([]);
  const [error, setError] = useState("");
  const [tool, setTool] = useState("");
  const [demo, setDemo] = useState<{ id: string; name: string }[]>([]);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<U[]>([]);
  const [tab, setTab] = useState<"" | "CLIENT" | "FACTORY">("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ tab: "", q: "" });
  const [open, setOpen] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const p = new URLSearchParams();
    if (applied.tab) p.set("role", applied.tab);
    if (applied.q) p.set("q", applied.q);
    const r = await fetch(`/api/admin/users?${p}`);
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setStats(d.stats);
    setUsers(d.users);
  }, [applied]);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/factories?status=PENDING");
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setRows(d.factories);
  }, []);
  const loadDemo = useCallback(async () => {
    const r = await fetch("/api/admin/demo-factories");
    if (r.ok) setDemo((await r.json()).factories);
  }, []);

  useEffect(() => { load(); loadDemo(); }, [load, loadDemo]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function syncCategories() {
    setTool("");
    const r = await fetch("/api/admin/categories/sync", { method: "POST" });
    const d = await r.json();
    setTool(r.ok ? `تم تحديث التصنيفات. العدد الكلي الآن: ${d.total}` : d.error);
  }

  async function deleteDemo() {
    if (!confirm(`سيتم حذف ${demo.length} مصانع تجريبية نهائياً مع منتجاتها وحساباتها. متابعة؟`)) return;
    setTool("");
    const r = await fetch("/api/admin/demo-factories", { method: "POST" });
    const d = await r.json();
    setTool(r.ok ? `تم حذف ${d.deleted} مصنع تجريبي.` : d.error);
    loadDemo();
    loadUsers();
  }

  async function review(id: string, action: "APPROVE" | "REJECT") {
    const r = await fetch(`/api/admin/factories/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    load();
    loadUsers();
  }

  const search = (e?: React.FormEvent) => { e?.preventDefault(); setApplied({ tab, q: q.trim() }); };
  const pickTab = (t: "" | "CLIENT" | "FACTORY") => { setTab(t); setApplied({ tab: t, q: q.trim() }); };

  const cards: [string, number | undefined, string][] = [
    ["إجمالي المسجلين", stats?.total, "text-brand"],
    ["المشترون", stats?.clients, "text-gray-900"],
    ["المصانع", stats?.factories, "text-accent"],
    ["بريد موثّق", stats?.verified, "text-green-700"],
    ["جدد آخر 7 أيام", stats?.last7, "text-gray-900"],
  ];
  const tabCls = (t: string) => `rounded-lg border px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-brand text-white" : "bg-white hover:bg-gray-50"}`;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold">لوحة الإدارة</h1>
      {error && <p className="mb-3 text-red-600">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map(([label, n, color]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="text-sm text-gray-500">{label}</div>
            <div className={`mt-1 text-3xl font-bold ${color}`}>{n ?? "…"}</div>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">المسجلون وبياناتهم</h2>
        <form onSubmit={search} className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" className={tabCls("")} onClick={() => pickTab("")}>الكل</button>
          <button type="button" className={tabCls("CLIENT")} onClick={() => pickTab("CLIENT")}>المشترون</button>
          <button type="button" className={tabCls("FACTORY")} onClick={() => pickTab("FACTORY")}>المصانع</button>
          <input className="min-w-56 flex-1 rounded border p-2" placeholder="ابحث بالاسم أو البريد أو الهاتف أو اسم الشركة…"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="rounded-lg bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-dark">بحث</button>
          <a href={`/api/admin/users/export?${new URLSearchParams({ ...(applied.tab ? { role: applied.tab } : {}), ...(applied.q ? { q: applied.q } : {}) })}`}
            className="rounded-lg border border-green-700 px-5 py-2 font-semibold text-green-700 hover:bg-green-50">تصدير Excel</a>
        </form>

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-start text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                {["الاسم", "النوع", "الشركة / المصنع", "البريد", "الهاتف", "الدولة", "البريد موثّق", "تاريخ التسجيل", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-start">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const c = countryByCode(u.country);
                const org = u.role === "FACTORY" ? u.factory?.name : u.companyName;
                const city = u.role === "FACTORY" ? u.factory?.region : u.companyCity;
                return (
                  <Fragment key={u.id}>
                    <tr className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{u.name}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${u.role === "FACTORY" ? "bg-accent-light text-accent" : "bg-brand-light text-brand"}`}>
                          {u.role === "FACTORY" ? "مصنع" : "مشترٍ"}
                        </span>
                      </td>
                      <td className="px-3 py-2">{org ?? "—"}{city ? ` · ${city}` : ""}</td>
                      <td className="px-3 py-2" dir="ltr">{u.email}</td>
                      <td className="px-3 py-2" dir="ltr">{u.phone ?? "—"}</td>
                      <td className="px-3 py-2">
                        {c ? (
                          <span className="flex items-center gap-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={flagUrl(c.code)} alt="" width={24} height={16} className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/10" />
                            {c.ar}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2">{u.emailVerifiedAt ? <span className="text-green-700">✓</span> : <span className="text-gray-400">—</span>}</td>
                      <td className="px-3 py-2">{date(u.createdAt)}</td>
                      <td className="px-3 py-2">
                        <button type="button" className="text-brand underline" onClick={() => setOpen(open === u.id ? null : u.id)}>
                          {open === u.id ? "إخفاء" : "تفاصيل"}
                        </button>
                      </td>
                    </tr>
                    {open === u.id && (
                      <tr className="border-b bg-gray-50">
                        <td colSpan={9} className="px-4 py-3 text-sm">
                          <div className="grid gap-2 md:grid-cols-2">
                                <div>السجل التجاري: <b dir="ltr">{(u.role === "FACTORY" ? u.factory?.commercialRegNo : u.companyRegNo) ?? "—"}</b></div>
                                <div>الرقم الضريبي: <b dir="ltr">{(u.role === "FACTORY" ? u.factory?.taxNo : u.companyTaxNo) ?? "—"}</b></div>
                            {u.role === "FACTORY" && u.factory && (
                              <div>حالة التوثيق: <b>{VERIFICATION[u.factory.verification] ?? u.factory.verification}</b></div>
                            )}
                          </div>
                          {u.description && <p className="mt-2 whitespace-pre-line text-gray-700">{u.description}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">لا يوجد مسجلون مطابقون.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className="mb-3 text-lg font-semibold">طلبات توثيق المصانع</h2>
      {rows.length === 0 && <p className="text-gray-500">لا توجد مصانع بانتظار المراجعة.</p>}
      <div className="space-y-3">
        {rows.map((f) => (
          <div key={f.id} className="rounded-lg border bg-white p-4">
            <div className="font-semibold">{f.name} <span className="text-sm font-normal text-gray-500">· {f.region}</span></div>
            <div className="text-sm text-gray-500">{f.user.name} — {f.user.email} — <span dir="ltr">{f.user.phone}</span></div>
            <div className="text-sm">السجل: <b dir="ltr">{f.commercialRegNo ?? "—"}</b> · الرقم الضريبي: <b dir="ltr">{f.taxNo ?? "—"}</b></div>
            <p className="mt-2 text-sm">{f.description}</p>
            <p className="text-sm text-gray-500">{f.address}</p>
            <ul className="mt-2 text-sm">
              {f.certifications.map((c) => (
                <li key={c.id}>
                  {c.name}{c.issuer ? ` (${c.issuer})` : ""}{" "}
                  {c.fileUrl && <a href={c.fileUrl} target="_blank" className="text-brand underline">المستند</a>}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button onClick={() => review(f.id, "APPROVE")} className="rounded bg-green-600 px-3 py-1 text-white">اعتماد</button>
              <button onClick={() => review(f.id, "REJECT")} className="rounded border px-3 py-1">رفض</button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">أدوات الإدارة</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={syncCategories} className="rounded bg-brand px-4 py-2 text-white">تحديث قائمة التصنيفات</button>
          {demo.length > 0 && (
            <button onClick={deleteDemo} className="rounded border border-accent px-4 py-2 text-accent">حذف المصانع التجريبية ({demo.length})</button>
          )}
        </div>
        {demo.length > 0 && <p className="mt-2 text-xs text-gray-500">المصانع التجريبية: {demo.map((d) => d.name).join("، ")}</p>}
        {tool && <p className="mt-2 text-sm text-brand">{tool}</p>}
      </section>
    </div>
  );
}

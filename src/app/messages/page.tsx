"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Conv = {
  id: string;
  other: { id: string; name: string } | null;
  lastMessage: { body: string; createdAt: string } | null;
  unread: number;
};
type Msg = { id: string; senderId: string; body: string; createdAt: string };

function Messages() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(useSearchParams().get("c"));
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [me, setMe] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    const r = await fetch("/api/conversations");
    const d = await r.json();
    if (r.ok) setConvs(d.conversations);
  }, []);

  const loadMsgs = useCallback(async () => {
    if (!active) return;
    const r = await fetch(`/api/conversations/${active}/messages`);
    const d = await r.json();
    if (r.ok) { setMsgs(d.messages); setMe(d.me); }
    else setError(d.error);
  }, [active]);

  // Light polling; swap for websockets/SSE later.
  useEffect(() => {
    loadConvs();
    loadMsgs();
    const t = setInterval(() => { loadConvs(); loadMsgs(); }, 5000);
    return () => clearInterval(t);
  }, [loadConvs, loadMsgs]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send() {
    if (!active || !text.trim()) return;
    const body = text;
    setText("");
    const r = await fetch(`/api/conversations/${active}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!r.ok) { setError((await r.json()).error); setText(body); return; }
    setError("");
    loadMsgs();
    loadConvs();
  }

  return (
    <div className="mx-auto flex h-[80vh] max-w-5xl gap-4 p-6">
      <aside className="w-1/3 overflow-y-auto rounded-lg border">
        {convs.length === 0 && <p className="p-3 text-sm text-gray-500">لا توجد محادثات.</p>}
        {convs.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)}
            className={`block w-full border-b p-3 text-start ${active === c.id ? "bg-brand-light " : ""}`}>
            <div className="flex justify-between">
              <b>{c.other?.name ?? "—"}</b>
              {c.unread > 0 && <span className="rounded-full bg-brand px-2 text-xs text-white">{c.unread}</span>}
            </div>
            <div className="truncate text-sm text-gray-500">{c.lastMessage?.body ?? "لا توجد رسائل بعد"}</div>
          </button>
        ))}
      </aside>

      <section className="flex flex-1 flex-col rounded-lg border">
        {!active ? (
          <p className="m-auto text-gray-500">اختر محادثة</p>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {msgs.map((m) => (
                <div key={m.id}
                  className={`max-w-[75%] rounded-lg border p-2 text-sm ${m.senderId === me ? "ms-auto bg-brand text-white" : ""}`}>
                  {m.body}
                  <div className="text-[10px] opacity-60">{new Date(m.createdAt).toLocaleTimeString("ar-u-nu-latn")}</div>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            {error && <p className="px-3 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 border-t p-3">
              <input className="flex-1 rounded border p-2" value={text} placeholder="اكتب رسالة…"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()} />
              <button onClick={send} className="rounded bg-brand px-4 text-white">إرسال</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={<p className="p-6">جارٍ التحميل…</p>}><Messages /></Suspense>;
}

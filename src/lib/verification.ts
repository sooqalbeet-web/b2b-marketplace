import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/guards";
import { sendMail } from "@/lib/mail";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_ATTEMPTS = 5;

const hashCode = (userId: string, code: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`${userId}:${code}`).digest("hex");

/** Creates (or replaces) the user's 6-digit code and emails it. Throws 429 inside the cooldown window. */
export async function issueVerificationCode(userId: string, email: string, opts?: { enforceCooldown?: boolean }) {
  if (opts?.enforceCooldown) {
    const existing = await prisma.emailVerification.findUnique({ where: { userId } });
    if (existing && Date.now() - existing.sentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new HttpError(429, "Please wait before requesting another code.");
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const data = { codeHash: hashCode(userId, code), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0, sentAt: new Date() };
  await prisma.emailVerification.upsert({ where: { userId }, update: data, create: { userId, ...data } });

  try {
    await sendMail({
      to: email,
      subject: "رمز التحقق — سوق البيت",
      text: `رمز التحقق الخاص بك: ${code}\nصالح لمدة 10 دقائق. إذا لم تطلبه فتجاهل هذه الرسالة.`,
      html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8">
        <h2 style="color:#13545e">سوق البيت — SOOQ AL BEET</h2>
        <p>رمز التحقق الخاص بك:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#780606" dir="ltr">${code}</p>
        <p>صالح لمدة 10 دقائق. إذا لم تطلبه فتجاهل هذه الرسالة.</p></div>`,
    });
  } catch (e) {
    await prisma.emailVerification.deleteMany({ where: { userId } }); // let the user retry immediately
    console.error("sendMail failed", e);
    throw new HttpError(502, "Could not send the verification email. Try again later.");
  }
}

/** Checks a submitted code. Counts every attempt; locks after MAX_ATTEMPTS until a new code is issued. */
export async function checkVerificationCode(userId: string, code: string) {
  const rec = await prisma.emailVerification.findUnique({ where: { userId } });
  if (!rec || rec.expiresAt.getTime() < Date.now()) {
    throw new HttpError(400, "Code expired or not found. Request a new one.");
  }
  if (rec.attempts >= MAX_ATTEMPTS) throw new HttpError(429, "Too many attempts. Request a new code.");

  await prisma.emailVerification.update({ where: { userId }, data: { attempts: { increment: 1 } } });

  const a = Buffer.from(hashCode(userId, code));
  const b = Buffer.from(rec.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(400, "Incorrect verification code.");
}

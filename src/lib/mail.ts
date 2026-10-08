import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html: string };

let transporter: nodemailer.Transporter | null = null;

export async function sendMail(m: Mail) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_HOST is not configured.");
    console.log(`\n[DEV MAIL] to: ${m.to}\nsubject: ${m.subject}\n${m.text}\n`);
    return;
  }
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({ from: process.env.MAIL_FROM ?? "no-reply@sooqalbeet.com", ...m });
}

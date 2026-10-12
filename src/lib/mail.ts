import { createTransport } from "nodemailer";

type Mail = { to: string; subject: string; text: string; html: string };

const buildTransporter = () => {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
};

// The type is inferred from buildTransporter, so it does not depend on the nodemailer typings.
let transporter: ReturnType<typeof buildTransporter> | null = null;

export async function sendMail(m: Mail) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_HOST is not configured.");
    console.log(`\n[DEV MAIL] to: ${m.to}\nsubject: ${m.subject}\n${m.text}\n`);
    return;
  }
  transporter ??= buildTransporter();
  await transporter.sendMail({ from: process.env.MAIL_FROM ?? "no-reply@sooqalbeet.com", ...m });
}

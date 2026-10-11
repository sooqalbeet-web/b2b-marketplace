// WhatsApp verification codes via the Meta WhatsApp Business Cloud API (authentication template).
// Required env vars: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE
// Optional: WHATSAPP_LANG (default "ar"), WHATSAPP_API_VERSION (default "v23.0")

export const whatsappEnabled = () =>
  Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TEMPLATE);

export async function sendWhatsAppCode(phone: string, code: string) {
  if (!whatsappEnabled()) throw new Error("WhatsApp is not configured.");
  const to = phone.replace(/\D/g, "");
  const version = process.env.WHATSAPP_API_VERSION ?? "v23.0";
  const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE,
        language: { code: process.env.WHATSAPP_LANG ?? "ar" },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
        ],
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
}

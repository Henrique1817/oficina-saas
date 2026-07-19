/** Contato de suporte da plataforma (pilots / soft launch). */
export function getSupportContact() {
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
  const email = (process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "").trim() || null;
  const waLink = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        "Oi! Preciso de ajuda com a Oficina (soft launch).",
      )}`
    : null;
  return {
    whatsapp,
    waLink,
    email,
    available: Boolean(waLink || email),
  };
}

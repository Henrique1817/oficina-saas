function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML personalizado do convite (magic link Supabase). */
export function buildInviteEmailHtml(input: {
  organizationName: string;
  roleLabel: string;
  magicUrl: string;
  invitePageUrl?: string;
  invitedByName?: string | null;
}) {
  const org = escapeHtml(input.organizationName);
  const role = escapeHtml(input.roleLabel);
  const by = input.invitedByName
    ? `<p style="margin:0 0 16px;color:#a3a3a3;font-size:14px">Convite de <strong style="color:#f5f5f5">${escapeHtml(input.invitedByName)}</strong></p>`
    : "";
  const alt = input.invitePageUrl
    ? `<p style="margin:24px 0 0;color:#737373;font-size:12px;line-height:1.5">Ou abra o convite depois de entrar: <a href="${escapeHtml(input.invitePageUrl)}" style="color:#f59e0b">${escapeHtml(input.invitePageUrl)}</a></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#050505;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#111;border:1px solid #262626;border-radius:12px;padding:32px">
        <tr><td>
          <p style="margin:0 0 8px;color:#f59e0b;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">Oficina</p>
          <h1 style="margin:0 0 12px;color:#fafafa;font-size:24px;line-height:1.25">Você foi convidado</h1>
          ${by}
          <p style="margin:0 0 20px;color:#d4d4d4;font-size:15px;line-height:1.6">
            Entre na oficina <strong style="color:#fff">${org}</strong> como
            <strong style="color:#fff">${role}</strong>.
          </p>
          <p style="margin:0 0 28px;color:#a3a3a3;font-size:14px;line-height:1.5">
            Este é um link mágico: ao clicar, você autentica automaticamente
            e segue para aceitar o convite. Válido por tempo limitado.
          </p>
          <a href="${escapeHtml(input.magicUrl)}"
             style="display:inline-block;background:#f59e0b;color:#111;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px">
            Aceitar convite
          </a>
          ${alt}
          <p style="margin:28px 0 0;color:#525252;font-size:11px;line-height:1.5">
            Se você não esperava este e-mail, ignore-o. Nenhum acesso é criado sem o seu aceite.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

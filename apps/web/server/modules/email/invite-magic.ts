import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/server/modules/email/send";
import { inviteRepository } from "@/server/modules/users/invite.repository";
import type { UserRole } from "@oficina/database";

function appUrlSafe() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export type SendInviteMagicResult = {
  sent: boolean;
  channel: "resend" | "supabase" | "none";
  magicLink?: string;
  error?: string;
};

/**
 * Gera magic/invite link do Supabase Auth e envia e-mail personalizado.
 * Preferência: HTML próprio via Resend com o action_link do Supabase.
 * Fallback: inviteUserByEmail (SMTP do Supabase).
 */
export async function sendInviteMagicEmail(input: {
  to: string;
  organizationName: string;
  role: UserRole;
  inviteToken: string;
  invitedByName?: string | null;
}): Promise<SendInviteMagicResult> {
  const roleLabel = inviteRepository.roleLabel(input.role);
  const appUrl = appUrlSafe();
  const invitePath = `/invite/${input.inviteToken}`;
  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(invitePath)}`;

  const admin = createAdminClient();

  let actionLink: string | null = null;
  let linkError: string | null = null;

  const inviteLink = await admin.auth.admin.generateLink({
    type: "invite",
    email: input.to,
    options: {
      redirectTo,
      data: {
        organization_name: input.organizationName,
        role: input.role,
        role_label: roleLabel,
        invite_token: input.inviteToken,
        invited_by: input.invitedByName ?? null,
        app: "oficina",
      },
    },
  });

  if (inviteLink.error || !inviteLink.data?.properties?.action_link) {
    const magic = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: input.to,
      options: {
        redirectTo,
        data: {
          organization_name: input.organizationName,
          role: input.role,
          role_label: roleLabel,
          invite_token: input.inviteToken,
          invited_by: input.invitedByName ?? null,
          app: "oficina",
        },
      },
    });
    if (magic.error || !magic.data?.properties?.action_link) {
      linkError =
        magic.error?.message ||
        inviteLink.error?.message ||
        "Não foi possível gerar o magic link";
      console.error("[invite:magic] generateLink failed", {
        invite: inviteLink.error?.message,
        magic: magic.error?.message,
      });
    } else {
      actionLink = magic.data.properties.action_link;
    }
  } else {
    actionLink = inviteLink.data.properties.action_link;
  }

  if (!actionLink) {
    const { error } = await admin.auth.admin.inviteUserByEmail(input.to, {
      redirectTo,
      data: {
        organization_name: input.organizationName,
        role: input.role,
        role_label: roleLabel,
        invite_token: input.inviteToken,
      },
    });
    if (error) {
      console.error("[invite:magic] inviteUserByEmail failed", error.message);
      return {
        sent: false,
        channel: "none",
        error: linkError || error.message,
      };
    }
    console.info("[invite:magic] enviado via SMTP Supabase (inviteUserByEmail)", {
      to: input.to,
    });
    return { sent: true, channel: "supabase" };
  }

  const mail = await sendInviteEmail({
    to: input.to,
    organizationName: input.organizationName,
    acceptUrl: actionLink,
    role: roleLabel,
    invitedByName: input.invitedByName,
    invitePageUrl: `${appUrl}${invitePath}`,
  });

  if (mail.sent) {
    return { sent: true, channel: "resend", magicLink: actionLink };
  }

  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(input.to, {
    redirectTo,
    data: {
      organization_name: input.organizationName,
      role: input.role,
      role_label: roleLabel,
      invite_token: input.inviteToken,
    },
  });

  if (!inviteErr) {
    console.info("[invite:magic] fallback SMTP Supabase", { to: input.to });
    return { sent: true, channel: "supabase", magicLink: actionLink };
  }

  console.info(
    "[invite:magic] e-mail não enviado (configure RESEND_API_KEY). Link:",
    actionLink,
  );
  return {
    sent: false,
    channel: "none",
    magicLink: actionLink,
    error:
      mail.error instanceof Error
        ? mail.error.message
        : inviteErr.message || "E-mail não enviado",
  };
}

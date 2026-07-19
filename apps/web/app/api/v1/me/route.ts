import { withAuth } from "@oficina/auth";
import { apiSuccess } from "@oficina/shared";

export const GET = withAuth(
  async (ctx) => {
    return apiSuccess({
      id: ctx.profile.id,
      email: ctx.profile.email,
      fullName: ctx.profile.fullName,
      role: ctx.role,
      organizationId: ctx.organizationId,
      organizationSlug: ctx.organizationSlug,
    });
  },
  { allowWithoutPlan: true },
);

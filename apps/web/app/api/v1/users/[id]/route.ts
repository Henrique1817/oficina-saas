import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, updateProfileRoleSchema, updateProfileSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { userRepository } from "@/server/modules/users/user.repository";

export const GET = withAuth(
  async (ctx, request) => {
    const id = new URL(request.url).pathname.split("/").pop()!;
    const user = await userRepository.getById(ctx.organizationId, id);
    if (!user) return apiError("User not found", 404);
    return apiSuccess(user);
  },
  { roles: ["ADMIN"] },
);

export const PATCH = withAuth(
  async (ctx, request) => {
    const id = new URL(request.url).pathname.split("/").pop()!;
    const parsed = await parseJson(request, updateProfileRoleSchema.or(updateProfileSchema));
    if ("error" in parsed) return parsed.error;

    if ("role" in parsed.data) {
      try {
        const user = await userRepository.updateRole(ctx.organizationId, id, parsed.data.role);
        return apiSuccess(user);
      } catch {
        return apiError("User not found", 404);
      }
    }

    try {
      const user = await userRepository.updateProfile(ctx.organizationId, id, parsed.data);
      return apiSuccess(user);
    } catch {
      return apiError("User not found", 404);
    }
  },
  { roles: ["ADMIN"] },
);

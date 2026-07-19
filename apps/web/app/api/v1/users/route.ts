import { withAuth } from "@oficina/auth";
import { apiSuccess } from "@oficina/shared";
import { userRepository } from "@/server/modules/users/user.repository";

export const GET = withAuth(
  async (ctx) => {
    const users = await userRepository.list(ctx.organizationId);
    return apiSuccess(users);
  },
  { roles: ["ADMIN", "MANAGER"] },
);

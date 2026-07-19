import { withAuth } from "@oficina/auth";
import { apiSuccess } from "@oficina/shared";
import { userRepository } from "@/server/modules/users/user.repository";
import { toolRepository } from "@/server/modules/tools/tool.repository";

export const GET = withAuth(async (ctx) => {
  const [stats, toolsInUse] = await Promise.all([
    userRepository.getDashboardStats(ctx.organizationId),
    toolRepository.toolsInUse(ctx.organizationId),
  ]);
  return apiSuccess({ ...stats, toolsInUse });
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

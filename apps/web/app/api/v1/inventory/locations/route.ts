import { withAuth } from "@oficina/auth";
import { apiSuccess } from "@oficina/shared";
import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";

export const GET = withAuth(async (ctx) => {
  const locations = await inventoryRepository.listLocations(ctx.organizationId);
  return apiSuccess(locations);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

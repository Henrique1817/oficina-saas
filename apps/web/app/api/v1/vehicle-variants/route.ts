import { withAuth } from "@oficina/auth";
import { apiSuccess, createVehicleVariantSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { vehicleRepository } from "@/server/modules/vehicles/vehicle.repository";

export const GET = withAuth(async (ctx, request) => {
  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const variants = await vehicleRepository.listVariants(ctx.organizationId, q);
  return apiSuccess(variants);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createVehicleVariantSchema);
  if ("error" in parsed) return parsed.error;
  const variant = await vehicleRepository.createVariant(ctx.organizationId, parsed.data);
  return apiSuccess(variant, 201);
}, { roles: ["ADMIN", "MANAGER"] });

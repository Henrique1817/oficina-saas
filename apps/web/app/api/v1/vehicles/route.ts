import { withAuth } from "@oficina/auth";
import { apiSuccess, createVehicleSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { vehicleRepository } from "@/server/modules/vehicles/vehicle.repository";

export const GET = withAuth(async (ctx, request) => {
  const customerId = new URL(request.url).searchParams.get("customerId");
  if (!customerId) {
    const plate = new URL(request.url).searchParams.get("plate");
    if (plate) {
      const vehicle = await vehicleRepository.getByPlate(ctx.organizationId, plate);
      return apiSuccess(vehicle);
    }
    return apiSuccess([]);
  }
  const vehicles = await vehicleRepository.listByCustomer(ctx.organizationId, customerId);
  return apiSuccess(vehicles);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createVehicleSchema);
  if ("error" in parsed) return parsed.error;
  const vehicle = await vehicleRepository.create(ctx.organizationId, parsed.data);
  return apiSuccess(vehicle, 201);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

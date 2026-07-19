import { withAuth } from "@oficina/auth";
import { apiSuccess, createCustomerSchema, customerQuerySchema } from "@oficina/shared";
import { parseJson, parseSearchParams } from "@/server/lib/parse";
import { customerRepository } from "@/server/modules/customers/customer.repository";

export const GET = withAuth(async (ctx, request) => {
  const parsed = parseSearchParams(request.url, customerQuerySchema);
  if ("error" in parsed) return parsed.error;
  const result = await customerRepository.list(ctx.organizationId, parsed.data);
  return apiSuccess(result);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createCustomerSchema);
  if ("error" in parsed) return parsed.error;
  const customer = await customerRepository.create(ctx.organizationId, parsed.data);
  return apiSuccess(customer, 201);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

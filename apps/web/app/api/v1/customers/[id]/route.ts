import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, updateCustomerSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { customerRepository } from "@/server/modules/customers/customer.repository";

function getId(request: Request) {
  return new URL(request.url).pathname.split("/").pop()!;
}

export const GET = withAuth(async (ctx, request) => {
  const id = getId(request);
  const history = new URL(request.url).searchParams.get("history") === "1";
  const customer = history
    ? await customerRepository.getProfile(ctx.organizationId, id)
    : await customerRepository.getById(ctx.organizationId, id);
  if (!customer) return apiError("Customer not found", 404);
  return apiSuccess(customer);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const PATCH = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, updateCustomerSchema);
  if ("error" in parsed) return parsed.error;
  try {
    const customer = await customerRepository.update(ctx.organizationId, getId(request), parsed.data);
    return apiSuccess(customer);
  } catch {
    return apiError("Customer not found", 404);
  }
}, { roles: ["ADMIN", "MANAGER"] });

export const DELETE = withAuth(async (ctx, request) => {
  try {
    await customerRepository.delete(ctx.organizationId, getId(request));
    return apiSuccess({ deleted: true });
  } catch {
    return apiError("Customer not found", 404);
  }
}, { roles: ["ADMIN"] });

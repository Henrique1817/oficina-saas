/* 
  Este arquivo é responsável por parsear os dados da requisição para o formato esperado pelo schema.
  ou seja, se o schema é um objeto, o parseJson irá parsear o corpo da requisição para um objeto.
*/

import { apiError } from "@oficina/shared";
import type { z } from "zod";

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: Response }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return { error: apiError(result.error.message, 400, "VALIDATION_ERROR") };
    }
    return { data: result.data };
  } catch {
    return { error: apiError("Invalid JSON body", 400) };
  }
}

export function parseSearchParams<T extends z.ZodType>(
  url: string,
  schema: T,
): { data: z.infer<T> } | { error: Response } {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    return { error: apiError(result.error.message, 400, "VALIDATION_ERROR") };
  }
  return { data: result.data };
}

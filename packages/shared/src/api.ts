export type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function apiError(message: string, status = 400, code?: string): Response {
  return Response.json({ error: message, code } satisfies ApiError, { status });
}
